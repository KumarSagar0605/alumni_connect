export interface AssessmentQuestion {
  id: string;
  type: 'mcq' | 'code_debug';
  prompt: string;
  options?: string[];
  answer_key: string;
  rubric: string;
}

export interface GeneratedAssessment {
  skills_evaluated: string[];
  questions: AssessmentQuestion[];
}

export interface Assessment {
  id: string;
  jdId: string;
  createdByAlumniId: string;
  title: string;
  skillsEvaluated: string[];
  questions: AssessmentQuestion[];
  timeLimitMinutes: number;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
}

export interface AssessmentInvitation {
  id: string;
  assessmentId: string;
  studentId: string;
  token: string;
  status: 'pending' | 'started' | 'completed' | 'expired';
  score: number | null;
  integrityFlags: {
    tab_switches: number;
    blur_duration_seconds: number;
    copy_attempts: number;
  };
  answers: Record<string, string> | null;
  startedAt: string | null;
  submittedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface CandidateCompositeScore {
  id: string;
  studentId: string;
  jdId: string;
  resumeMatchScore: number;
  verifiedTestScore: number | null;
  compositeScore: number | null;
  verifiedStatus: boolean;
  updatedAt: string;
}
