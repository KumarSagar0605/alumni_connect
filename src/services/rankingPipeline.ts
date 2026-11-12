/**
 * Unified two-stage ranking pipeline.
 * Stage 1: deterministic math pre-filter → top 5.
 * Stage 2: LLM qualitative enrichment with 9s timeout + graceful math fallback.
 * Budget: ~2.5s Gemini attempt + ~4.5s Groq completion fits inside the 9s race.
 * NOTE: model strings intentionally NOT llama/gemini-2.5 — live probes show
 * `gemini-2.5-flash` → 404 and no llama chat model on this Groq key
 * (available: openai/gpt-oss-120b, gpt-oss-20b, qwen/qwen3.8-27b).
 */
import {
  rankCandidatesMathematically,
  type CandidateResume,
  type MathRankedCandidate,
} from './mathMatchingEngine';
import {
  shortlistTopCandidatesWithLLM,
  type ShortlistedCandidateInsight,
} from './geminiService';

export const PIPELINE_TOP_N = 5;
export const LLM_TIMEOUT_MS = 9000;

export type RankingSource = 'llm_enriched' | 'math_fallback';

export interface RankingResult {
  source: RankingSource;
  data: ShortlistedCandidateInsight[];
  mathTop: MathRankedCandidate[];
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function mathToInsight(c: MathRankedCandidate): ShortlistedCandidateInsight {
  return {
    user_id: c.user_id,
    full_name: c.full_name,
    semantic_score: Math.round(c.s_total * 100),
    match_verdict: c.s_total >= 0.75 ? 'Strong Match' : 'Moderate Match',
    key_strengths: c.matched_skills,
    missing_or_weak_skills: c.unmatched_skills,
    alumni_rationale: `Ranked via deterministic match (Skills: ${Math.round(c.s_skills * 100)}%, CGPA: ${c.cgpa}).`,
  };
}

/**
 * Rank + shortlist with resilience. UI must never hang on LLM outage:
 * on any LLM error/timeout we return the math fallback in the same shape.
 */
export async function rankAndShortlistCandidates(
  jobDescription: string,
  requiredSkills: string[],
  candidates: CandidateResume[]
): Promise<RankingResult> {
  // Step 1: deterministic pre-filter on all applicants
  const mathRanked = rankCandidatesMathematically(jobDescription, requiredSkills, candidates);
  const topN = mathRanked.slice(0, PIPELINE_TOP_N);

  if (topN.length === 0) {
    return { source: 'math_fallback', data: [], mathTop: mathRanked };
  }

  // Step 2: LLM enrichment (minimal payload for speed).
  // user_id/full_name keys are load-bearing: the LLM must echo them back so we
  // can join insights to candidates. Everything else is compressed.
  try {
    const llmInput = topN.map((c) => {
      const raw = (candidates || []).find((r) => r.user_id === c.user_id);
      const firstProject = (raw?.projects || [])[0] as any;
      const topProject = (
        firstProject?.title ||
        firstProject?.name ||
        ((raw?.tech_stack || [])[0] as string) ||
        ''
      ).slice(0, 100);
      return {
        user_id: c.user_id,
        full_name: c.full_name,
        skills: (c.skills || []).slice(0, 8),
        cgpa: c.cgpa,
        top_project: topProject,
      };
    });

    const enriched = await withTimeout(
      shortlistTopCandidatesWithLLM(jobDescription, llmInput),
      LLM_TIMEOUT_MS,
      'LLM enrichment'
    );
    return { source: 'llm_enriched', data: enriched, mathTop: mathRanked };
  } catch (err: any) {
    // Step 3: graceful fallback — same interface, zero UI breakage
    console.warn('[rankingPipeline] LLM enrichment failed, using math fallback:', err?.message || err);
    return { source: 'math_fallback', data: topN.map(mathToInsight), mathTop: mathRanked };
  }
}
