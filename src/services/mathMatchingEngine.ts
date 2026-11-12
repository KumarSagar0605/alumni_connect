/**
 * Deterministic Mathematical Pre-Filter — Stage 1 of the shortlisting engine.
 * S_total = 0.50 * S_skills + 0.30 * S_projects + 0.20 * S_academic
 */

export interface CandidateResume {
  user_id: string;
  full_name: string;
  skills?: string[] | null;
  cgpa?: number | null;
  summary?: string | null;
  projects?: { name?: string; description?: string; tech_stack?: string[] }[] | null;
  experience?: { title?: string; description?: string }[] | null;
  tech_stack?: string[] | null;
}

export interface MathRankedCandidate {
  user_id: string;
  full_name: string;
  cgpa: number;
  skills: string[];
  summary: string;
  s_total: number;
  s_skills: number;
  s_projects: number;
  s_academic: number;
  matched_skills: string[];
  unmatched_skills: string[];
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'shall', 'can', 'need', 'we', 'you', 'they', 'them', 'our', 'your', 'their', 'this',
  'that', 'these', 'those', 'it', 'its', 'who', 'whom', 'which', 'what', 'when', 'where',
  'how', 'all', 'each', 'other', 'into', 'out', 'up', 'down', 'over', 'under', 'again',
  'once', 'here', 'there', 'than', 'then', 'very', 'just', 'so', 'also', 'more',
  'most', 'such', 'only', 'own', 'same', 'too', 'using', 'used', 'use',
]);

function normToken(s: string): string {
  return s.toLowerCase().trim();
}

/** Tokenize free text: lowercase, split on non-alphanumerics, drop stop words + shorts. */
export function tokenize(text: string): string[] {
  const raw = (text || '').toLowerCase().split(/[^a-z0-9+#.]+/);
  const uniq = new Set<string>();
  for (const t of raw) {
    const tok = t.trim().replace(/^\.+|\.+$/g, '');
    if (tok.length < 2 || STOP_WORDS.has(tok)) continue;
    uniq.add(tok);
  }
  return [...uniq];
}

/** S_skills: Jaccard similarity over normalized skill tokens. */
export function jaccardSkills(jobSkills: string[], studentSkills: string[]): { score: number; matched: string[]; unmatched: string[] } {
  const kJob = new Set((jobSkills || []).map(normToken).filter(Boolean));
  const kStudentRaw = (studentSkills || []).map(normToken).filter(Boolean);
  const kStudent = new Set(kStudentRaw);

  if (kStudent.size === 0) return { score: 0.0, matched: [], unmatched: [...kJob] };
  const union = new Set([...kJob, ...kStudent]);
  if (union.size === 0) return { score: 0.0, matched: [], unmatched: [] };

  const inter = [...kJob].filter((k) => kStudent.has(k));
  const matched = inter;
  const unmatched = [...kJob].filter((k) => !kStudent.has(k));
  return { score: inter.length / union.size, matched, unmatched };
}

/** S_projects: tokenized keyword overlap |W_job ∩ W_project| / |W_job|, clamped [0,1]. */
export function projectKeywordOverlap(jobDescription: string, candidate: CandidateResume): number {
  const wJob = new Set(tokenize(jobDescription));
  if (wJob.size === 0) return 0;

  const parts: string[] = [];
  parts.push(candidate.summary || '');
  for (const p of candidate.projects || []) {
    parts.push(p?.name || '', p?.description || '', (p?.tech_stack || []).join(' '));
  }
  for (const e of candidate.experience || []) {
    parts.push(e?.title || '', e?.description || '');
  }
  parts.push((candidate.tech_stack || []).join(' '));

  const wProj = new Set(tokenize(parts.join(' ')));
  let hits = 0;
  for (const w of wJob) if (wProj.has(w)) hits++;
  const score = hits / wJob.size;
  return Math.min(1, Math.max(0, score));
}

/** S_academic: CGPA normalized to 10.0 scale. */
export function academicScore(cgpa: number | null | undefined): number {
  const c = Number(cgpa) || 0;
  return Math.min(c / 10.0, 1.0);
}

/**
 * Rank all candidates deterministically. Sorted desc by s_total.
 */
export function rankCandidatesMathematically(
  jobDescription: string,
  requiredSkills: string[],
  candidates: CandidateResume[]
): MathRankedCandidate[] {
  const wJob = new Set(tokenize(jobDescription));

  const ranked: MathRankedCandidate[] = (candidates || []).map((c) => {
    const skills = c.skills || [];
    const cgpa = Number(c.cgpa) || 0;

    const { score: s_skills, matched, unmatched } = jaccardSkills(requiredSkills || [], skills);
    const s_projects = projectKeywordOverlap(jobDescription, c);
    const s_academic = academicScore(cgpa);
    const s_total = 0.5 * s_skills + 0.3 * s_projects + 0.2 * s_academic;

    void wJob;
    return {
      user_id: c.user_id,
      full_name: c.full_name,
      cgpa,
      skills,
      summary: c.summary || '',
      s_total,
      s_skills,
      s_projects,
      s_academic,
      matched_skills: matched,
      unmatched_skills: unmatched,
    };
  });

  return ranked.sort((a, b) => b.s_total - a.s_total);
}
