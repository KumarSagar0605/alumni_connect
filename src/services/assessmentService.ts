// @ts-nocheck
import { supabase } from '../supabaseClient';
import type { Assessment, AssessmentInvitation, AssessmentQuestion, CandidateCompositeScore } from '../types/assessment';
import { generateAssessmentFromJD, gradeCodeAnswer } from './assessmentGenerator';

// ============================================================
// HELPER: Generate crypto-safe random token
// ============================================================
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// HELPER: Convert snake_case DB row to camelCase
// ============================================================
function mapAssessment(row: any): Assessment {
  return {
    id: row.id,
    jdId: row.jd_id,
    createdByAlumniId: row.created_by_alumni_id,
    title: row.title,
    skillsEvaluated: row.skills_evaluated || [],
    questions: row.questions || [],
    timeLimitMinutes: row.time_limit_minutes || 15,
    status: row.status || 'active',
    createdAt: row.created_at,
  };
}

function mapInvitation(row: any): AssessmentInvitation {
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    studentId: row.student_id,
    token: row.token,
    status: row.status || 'pending',
    score: row.score,
    integrityFlags: row.integrity_flags || { tab_switches: 0, blur_duration_seconds: 0, copy_attempts: 0 },
    answers: row.answers,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

function mapCompositeScore(row: any): CandidateCompositeScore {
  return {
    id: row.id,
    studentId: row.student_id,
    jdId: row.jd_id,
    resumeMatchScore: row.resume_match_score,
    verifiedTestScore: row.verified_test_score,
    compositeScore: row.composite_score,
    verifiedStatus: row.verified_status || false,
    updatedAt: row.updated_at,
  };
}

// ============================================================
// 1. GENERATE ASSESSMENT
// Alumni creates an assessment for a JD
// ============================================================
export async function createAssessment(
  alumniUserId: string,
  jdId: string,
  jdText: string,
  title: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): Promise<Assessment> {
  // Resolve alumni profile ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', alumniUserId)
    .single();

  if (!profile) throw new Error('Alumni profile not found');

  // Generate questions via Gemini
  const generated = await generateAssessmentFromJD(jdText, difficulty);

  // Save to Supabase
  const { data, error } = await supabase
    .from('assessments')
    .insert([{
      jd_id: jdId,
      created_by_alumni_id: profile.id,
      title,
      skills_evaluated: generated.skills_evaluated,
      questions: generated.questions,
      time_limit_minutes: 15,
      status: 'active',
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to save assessment: ${error.message}`);

  return mapAssessment(data);
}

// ============================================================
// 2. GET ASSESSMENT BY ID
// ============================================================
export async function getAssessment(assessmentId: string): Promise<Assessment | null> {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();

  if (error || !data) return null;
  return mapAssessment(data);
}

// ============================================================
// 3. GET ASSESSMENTS FOR A JD
// ============================================================
export async function getAssessmentsForJD(jdId: string): Promise<Assessment[]> {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('jd_id', jdId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapAssessment);
}

// ============================================================
// 4. GET ALUMNI'S ASSESSMENTS
// ============================================================
export async function getMyAssessments(alumniUserId: string): Promise<Assessment[]> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', alumniUserId)
    .single();

  if (!profile) return [];

  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('created_by_alumni_id', profile.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapAssessment);
}

// ============================================================
// 5. CREATE INVITATION
// Alumni invites a student to take an assessment
// ============================================================
export async function createInvitation(
  assessmentId: string,
  studentUserId: string
): Promise<AssessmentInvitation> {
  // Resolve student profile ID
  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', studentUserId)
    .single();

  if (!studentProfile) throw new Error('Student profile not found');

  // Get assessment for time limit
  const { data: assessment } = await supabase
    .from('assessments')
    .select('time_limit_minutes')
    .eq('id', assessmentId)
    .single();

  const timeLimit = assessment?.time_limit_minutes || 15;
  const linkValidityMinutes = 48 * 60; // 48 hours
  const expiresAt = new Date(Date.now() + linkValidityMinutes * 60 * 1000).toISOString();

  const token = generateToken();

  const { data, error } = await supabase
    .from('assessment_invitations')
    .insert([{
      assessment_id: assessmentId,
      student_id: studentProfile.id,
      token,
      status: 'pending',
      expires_at: expiresAt,
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create invitation: ${error.message}`);

  return mapInvitation(data);
}

// ============================================================
// 6. GET INVITATION BY TOKEN (student accesses test)
// Returns questions WITHOUT answer_key and rubric
// ============================================================
export async function getInvitationByToken(token: string): Promise<{
  invitation: AssessmentInvitation;
  assessment: Assessment;
  questions: Omit<AssessmentQuestion, 'answer_key' | 'rubric'>[];
} | null> {
  // Find invitation
  const { data: invRow, error: invErr } = await supabase
    .from('assessment_invitations')
    .select('*')
    .eq('token', token)
    .single();

  if (invErr || !invRow) return null;

  const invitation = mapInvitation(invRow);

  // Check expiration
  if (new Date(invitation.expiresAt) < new Date()) {
    await supabase
      .from('assessment_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id);
    return null;
  }

  // Get assessment with full questions
  const assessment = await getAssessment(invitation.assessmentId);
  if (!assessment) return null;

  // Strip answer_key and rubric for student view
  const safeQuestions = assessment.questions.map(({ answer_key, rubric, ...rest }) => rest);

  // Set started_at if first retrieval
  if (invitation.status === 'pending') {
    await supabase
      .from('assessment_invitations')
      .update({ status: 'started', started_at: new Date().toISOString() })
      .eq('id', invitation.id);
    invitation.status = 'started';
    invitation.startedAt = new Date().toISOString();
  }

  return { invitation, assessment, questions: safeQuestions };
}

// ============================================================
// 7. SUBMIT TEST
// Grade MCQs deterministically, code_debug via Gemini
// ============================================================
export async function submitTest(
  token: string,
  answers: Record<string, string>,
  telemetry: { tab_switches: number; blur_duration_seconds: number; copy_attempts: number; phone_detection_count?: number; phone_terminated?: boolean }
): Promise<{ score: number; compositeScore: number; verified: boolean }> {
  // Find invitation
  const { data: invRow, error: invErr } = await supabase
    .from('assessment_invitations')
    .select('*')
    .eq('token', token)
    .single();

  if (invErr || !invRow) throw new Error('Invalid test link.');

  const invitation = mapInvitation(invRow);

  if (invitation.status === 'completed') throw new Error('Test already submitted.');
  if (invitation.status === 'expired') throw new Error('Test has expired.');
  if (new Date(invitation.expiresAt) < new Date()) {
    await supabase.from('assessment_invitations').update({ status: 'expired' }).eq('id', invitation.id);
    throw new Error('Test has expired.');
  }

  // Time check: reject if elapsed > (time_limit * 60) + 5 seconds buffer
  if (invitation.startedAt) {
    const elapsed = (Date.now() - new Date(invitation.startedAt).getTime()) / 1000;
    const timeLimitSeconds = (invRow.time_limit_minutes || 15) * 60 + 5;
    if (elapsed > timeLimitSeconds) {
      await supabase.from('assessment_invitations').update({ status: 'expired' }).eq('id', invitation.id);
      throw new Error('Time limit exceeded. Test has been auto-submitted as expired.');
    }
  }

  // Get full questions with answer keys
  const { data: assessmentRow } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', invitation.assessmentId)
    .single();

  if (!assessmentRow) throw new Error('Assessment not found.');

  const questions: AssessmentQuestion[] = assessmentRow.questions || [];

  // Grade MCQs deterministically
  let rawScore = 0;
  const totalQuestions = questions.length;

  for (const q of questions) {
    const studentAnswer = (answers[q.id] || '').trim();
    if (q.type === 'mcq') {
      // Exact match on answer key letter
      if (studentAnswer.toUpperCase() === q.answer_key.toUpperCase()) {
        rawScore += 10; // Each question worth 10 points (total 100)
      }
    }
  }

  // Grade code_debug questions via Gemini
  for (const q of questions) {
    if (q.type === 'code_debug') {
      const studentAnswer = answers[q.id] || '';
      if (studentAnswer.trim()) {
        try {
          const result = await gradeCodeAnswer(q.prompt, q.rubric, studentAnswer);
          rawScore += result.score_out_of_10; // 0-10 points per code question
        } catch {
          // On failure, give 0
        }
      }
    }
  }

  // Normalize to 0-100 scale
  // MCQs: 8 questions * 10 pts = 80 max
  // Code: 2 questions * 10 pts = 20 max
  // Total max = 100
  const normalizedScore = Math.min(100, rawScore);

  // Integrity adjustment
  const tabSwitches = telemetry.tab_switches || 0;
  const phoneDetections = telemetry.phone_detection_count || 0;
  const phoneTerminated = telemetry.phone_terminated || false;
  let adjustmentFactor = 1 - (0.05 * Math.min(tabSwitches, 4));
  // Phone detection: -15% per detection, capped at -60%
  adjustmentFactor -= (0.15 * Math.min(phoneDetections, 4));
  adjustmentFactor = Math.max(0.4, adjustmentFactor);
  // If phone terminated, zero the score
  const adjustedScore = phoneTerminated
    ? 0
    : Math.round(normalizedScore * adjustmentFactor * 100) / 100;

  // Update invitation
  await supabase
    .from('assessment_invitations')
    .update({
      status: 'completed',
      score: adjustedScore,
      answers,
      integrity_flags: {
        ...telemetry,
        phone_detection_count: phoneDetections,
        phone_terminated: phoneTerminated,
      },
      submitted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id);

  // Update or create composite score
  const compositeScore = await upsertCompositeScore(
    invitation.studentId,
    assessmentRow.jd_id,
    adjustedScore
  );

  return {
    score: adjustedScore,
    compositeScore: compositeScore.compositeScore || adjustedScore,
    verified: true,
  };
}

// ============================================================
// 8. UPSERT COMPOSITE SCORE
// ============================================================
async function upsertCompositeScore(
  studentId: string,
  jdId: string,
  testScore: number
): Promise<CandidateCompositeScore> {
  // Try to get existing composite score
  const { data: existing } = await supabase
    .from('candidate_composite_scores')
    .select('*')
    .eq('student_id', studentId)
    .eq('jd_id', jdId)
    .single();

  const resumeMatchScore = existing?.resume_match_score || 0;
  const compositeScore = Math.round((resumeMatchScore * 0.35 + testScore * 0.65) * 100) / 100;

  if (existing) {
    const { data } = await supabase
      .from('candidate_composite_scores')
      .update({
        verified_test_score: testScore,
        composite_score: compositeScore,
        verified_status: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();
    return mapCompositeScore(data);
  } else {
    const { data } = await supabase
      .from('candidate_composite_scores')
      .insert([{
        student_id: studentId,
        jd_id: jdId,
        resume_match_score: resumeMatchScore,
        verified_test_score: testScore,
        composite_score: compositeScore,
        verified_status: true,
      }])
      .select()
      .single();
    return mapCompositeScore(data);
  }
}

// ============================================================
// 9. GET INVITATIONS FOR AN ASSESSMENT (alumni view)
// ============================================================
export async function getInvitationsForAssessment(
  assessmentId: string
): Promise<(AssessmentInvitation & { studentName?: string; studentAvatar?: string })[]> {
  const { data, error } = await supabase
    .from('assessment_invitations')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  // Fetch student profiles
  const studentIds = [...new Set(data.map((r) => r.student_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', studentIds);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return data.map((row) => {
    const profile = profileMap.get(row.student_id);
    return {
      ...mapInvitation(row),
      studentName: profile?.full_name || 'Unknown',
      studentAvatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=S&background=9E2A2B&color=fff&size=200`,
    };
  });
}

// ============================================================
// 10. GET COMPOSITE SCORES FOR A JD
// ============================================================
export async function getCompositeScoresForJD(
  jdId: string
): Promise<CandidateCompositeScore[]> {
  const { data, error } = await supabase
    .from('candidate_composite_scores')
    .select('*')
    .eq('jd_id', jdId)
    .order('composite_score', { ascending: false });

  if (error || !data) return [];
  return data.map(mapCompositeScore);
}

// ============================================================
// 11. SAVE RESUME MATCH SCORE (called after JD ranking)
// ============================================================
export async function saveResumeMatchScores(
  jdId: string,
  candidates: { user_id: string; score: number }[]
): Promise<void> {
  for (const c of candidates) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', c.user_id)
      .single();

    if (!profile) continue;

    // Upsert
    const { data: existing } = await supabase
      .from('candidate_composite_scores')
      .select('id, verified_test_score')
      .eq('student_id', profile.id)
      .eq('jd_id', jdId)
      .single();

    if (existing) {
      const testScore = existing.verified_test_score;
      const composite = testScore !== null
        ? Math.round((c.score * 0.35 + testScore * 0.65) * 100) / 100
        : c.score;
      await supabase
        .from('candidate_composite_scores')
        .update({
          resume_match_score: c.score,
          composite_score: composite,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('candidate_composite_scores')
        .insert([{
          student_id: profile.id,
          jd_id: jdId,
          resume_match_score: c.score,
          composite_score: c.score,
        }]);
    }
  }
}

// ============================================================
// 12. CHECK IF ALUMNI HAS ASSESSMENT FOR A JD
// ============================================================
export async function hasAssessmentForJD(
  alumniUserId: string,
  jdId: string
): Promise<Assessment | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', alumniUserId)
    .single();

  if (!profile) return null;

  const { data } = await supabase
    .from('assessments')
    .select('*')
    .eq('created_by_alumni_id', profile.id)
    .eq('jd_id', jdId)
    .eq('status', 'active')
    .limit(1)
    .single();

  return data ? mapAssessment(data) : null;
}
