-- ============================================================
-- SKILL ASSESSMENT MODULE MIGRATION
-- Run this in Supabase SQL Editor
-- All additive — no existing tables/columns altered
-- ============================================================

-- 1. ASSESSMENTS table
-- Stores AI-generated assessment tests for a JD
-- ============================================================
CREATE TABLE IF NOT EXISTS assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  jd_id uuid NOT NULL,
  created_by_alumni_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  skills_evaluated text[] DEFAULT '{}',
  questions jsonb NOT NULL DEFAULT '[]',
  time_limit_minutes int DEFAULT 15,
  status varchar(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alumni can view their own assessments"
  ON assessments FOR SELECT TO authenticated
  USING (
    created_by_alumni_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Alumni can create assessments"
  ON assessments FOR INSERT TO authenticated
  WITH CHECK (
    created_by_alumni_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Alumni can update their own assessments"
  ON assessments FOR UPDATE TO authenticated
  USING (
    created_by_alumni_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Students can view active assessments (needed to take the test)
CREATE POLICY "Students can view active assessments"
  ON assessments FOR SELECT TO authenticated
  USING (status = 'active');

-- 2. ASSESSMENT_INVITATIONS table
-- Tracks per-student invitations and test attempts
-- ============================================================
CREATE TABLE IF NOT EXISTS assessment_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending', 'started', 'completed', 'expired')),
  score float DEFAULT NULL,
  integrity_flags jsonb DEFAULT '{"tab_switches": 0, "blur_duration_seconds": 0, "copy_attempts": 0}',
  answers jsonb DEFAULT NULL,
  started_at timestamptz DEFAULT NULL,
  submitted_at timestamptz DEFAULT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessment_invitations ENABLE ROW LEVEL SECURITY;

-- Alumni can view invitations for their assessments
CREATE POLICY "Alumni can view invitations for their assessments"
  ON assessment_invitations FOR SELECT TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM assessments
      WHERE created_by_alumni_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Alumni can create invitations
CREATE POLICY "Alumni can create invitations"
  ON assessment_invitations FOR INSERT TO authenticated
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM assessments
      WHERE created_by_alumni_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Students can view their own invitations (needed to access test)
CREATE POLICY "Students can view their own invitations"
  ON assessment_invitations FOR SELECT TO authenticated
  USING (
    student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Students can update their own invitations (submit answers)
CREATE POLICY "Students can update their own invitations"
  ON assessment_invitations FOR UPDATE TO authenticated
  USING (
    student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- 3. CANDIDATE_COMPOSITE_SCORES table
-- Merges resume match + verified test score into a composite rank
-- ============================================================
CREATE TABLE IF NOT EXISTS candidate_composite_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  jd_id uuid NOT NULL,
  resume_match_score float NOT NULL,
  verified_test_score float DEFAULT NULL,
  composite_score float DEFAULT NULL,
  verified_status boolean DEFAULT FALSE,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, jd_id)
);

ALTER TABLE candidate_composite_scores ENABLE ROW LEVEL SECURITY;

-- Alumni can view composite scores for their JDs
CREATE POLICY "Alumni can view composite scores"
  ON candidate_composite_scores FOR SELECT TO authenticated
  USING (true);

-- Alumni can upsert composite scores
CREATE POLICY "Alumni can create composite scores"
  ON candidate_composite_scores FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Alumni can update composite scores"
  ON candidate_composite_scores FOR UPDATE TO authenticated
  USING (true);

-- 4. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_assessments_jd ON assessments(jd_id);
CREATE INDEX IF NOT EXISTS idx_assessments_alumni ON assessments(created_by_alumni_id);
CREATE INDEX IF NOT EXISTS idx_invitations_assessment ON assessment_invitations(assessment_id);
CREATE INDEX IF NOT EXISTS idx_invitations_student ON assessment_invitations(student_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON assessment_invitations(token);
CREATE INDEX IF NOT EXISTS idx_composite_student ON candidate_composite_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_composite_jd ON candidate_composite_scores(jd_id);
