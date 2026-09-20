// @ts-nocheck
import { executeJsonCompletion, cleanAndParseJson } from './aiProvider';
import type { GeneratedAssessment } from '../types/assessment';

/**
 * Generate a 10-question technical verification test from a Job Description.
 * 8 MCQs + 2 code_debug questions.
 * Uses multi-provider fallback pipeline.
 */
export async function generateAssessmentFromJD(
  jdText: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): Promise<GeneratedAssessment> {
  const systemPrompt = `You are a technical assessment designer. Generate a 10-question verification test evaluating real engineering competency.

Generate exactly 10 questions:
- 8 Multiple Choice Questions (type: "mcq") focusing on real-world edge cases, debugging scenarios, and architectural trade-offs. Avoid generic definitions.
- 2 Code debugging/output questions (type: "code_debug") with short, readable code snippets.
- Seniority and tooling must strictly reflect the JD.
- Each question must have a clear answer_key and a grading rubric.

Return ONLY a valid JSON object with this exact schema:
{
  "skills_evaluated": ["skill1", "skill2"],
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "prompt": "question text",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "answer_key": "A",
      "rubric": "explanation of correct answer"
    },
    {
      "id": "q9",
      "type": "code_debug",
      "prompt": "What is the output of this code?\\n// code snippet here",
      "options": null,
      "answer_key": "expected output or fix",
      "rubric": "detailed explanation"
    }
  ]
}

Rules:
- answer_key for MCQ = letter (A, B, C, or D).
- answer_key for code_debug = expected output or corrected code.
- rubric explains WHY the answer is correct.
- Questions must be challenging and JD-specific, not generic.`;

  const userPrompt = `JOB DESCRIPTION:\n${jdText.slice(0, 8000)}\n\nDIFFICULTY LEVEL: ${difficulty}`;

  const raw = await executeJsonCompletion(systemPrompt, userPrompt);
  const parsed = cleanAndParseJson<GeneratedAssessment>(raw);

  // Ensure structure
  parsed.skills_evaluated = parsed.skills_evaluated || [];
  parsed.questions = (parsed.questions || []).map((q, i) => ({
    ...q,
    id: q.id || `q${i + 1}`,
    type: q.type || 'mcq',
    options: q.options || undefined,
    answer_key: q.answer_key || '',
    rubric: q.rubric || '',
  }));

  return parsed;
}

/**
 * Grade a code_debug answer using semantic evaluation.
 * Returns a score out of 10 and justification.
 * Uses multi-provider fallback pipeline.
 */
export async function gradeCodeAnswer(
  questionPrompt: string,
  rubric: string,
  studentAnswer: string
): Promise<{ score_out_of_10: number; justification: string }> {
  const systemPrompt = `You are a strict technical grader. Evaluate the student's answer against the rubric.
Grade on a scale of 0-10 considering correctness, completeness, and technical accuracy.
Return ONLY a valid JSON object:
{"score_out_of_10": <number 0-10>, "justification": "<brief explanation>"}`;

  const userPrompt = `QUESTION:\n${questionPrompt}\n\nEXPECTED ANSWER / RUBRIC:\n${rubric}\n\nSTUDENT'S ANSWER:\n${studentAnswer}`;

  try {
    const raw = await executeJsonCompletion(systemPrompt, userPrompt);
    const result = cleanAndParseJson<{ score_out_of_10: number; justification: string }>(raw);
    return {
      score_out_of_10: Math.max(0, Math.min(10, Number(result.score_out_of_10) || 0)),
      justification: result.justification || '',
    };
  } catch (err) {
    console.error('Grading service error:', err);
    return { score_out_of_10: 0, justification: 'Grading service unavailable.' };
  }
}
