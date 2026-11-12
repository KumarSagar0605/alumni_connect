-- ============================================================
-- SECURITY HARDENING MIGRATION (test-day fixes)
-- Run this in Supabase Dashboard → SQL Editor → New query → Run.
-- Replaces permissive USING/WITH CHECK (true) policies with scoped ones.
-- All statements are idempotent (DROP IF EXISTS first).
-- ============================================================

-- ------------------------------------------------------------
-- 1. candidate_composite_scores — was: ANY authenticated user
--    could SELECT/INSERT/UPDATE anyone's scores (score forgery).
--    Now: students see/write ONLY their own rows; alumni/admin/head
--    keep full access (ranking + invite flows need it).
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Alumni can view composite scores" ON candidate_composite_scores;
DROP POLICY IF EXISTS "Alumni can create composite scores" ON candidate_composite_scores;
DROP POLICY IF EXISTS "Alumni can update composite scores" ON candidate_composite_scores;

-- Staff (alumni/admin/head) can view all scores
CREATE POLICY "Staff can view composite scores"
  ON candidate_composite_scores FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role::text IN ('alumni', 'admin', 'head')
    )
  );

-- Students can view their OWN scores
CREATE POLICY "Students can view own composite scores"
  ON candidate_composite_scores FOR SELECT TO authenticated
  USING (
    student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Staff can insert scores (alumni invite/ranking flow)
CREATE POLICY "Staff can create composite scores"
  ON candidate_composite_scores FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role::text IN ('alumni', 'admin', 'head')
    )
  );

-- Students can insert their OWN score row (test submission flow)
CREATE POLICY "Students can create own composite scores"
  ON candidate_composite_scores FOR INSERT TO authenticated
  WITH CHECK (
    student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Staff can update any score; students can update ONLY their own row.
-- NOTE: a student can still touch their own row's columns — full
-- protection of score columns requires a SECURITY DEFINER RPC
-- (see guide). This blocks all cross-user tampering, the worse hole.
CREATE POLICY "Staff can update composite scores"
  ON candidate_composite_scores FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role::text IN ('alumni', 'admin', 'head')
    )
  );

CREATE POLICY "Students can update own composite scores"
  ON candidate_composite_scores FOR UPDATE TO authenticated
  USING (
    student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- 2. opportunities — was: ANY authenticated user could UPDATE any JD.
--    Now: only alumni/admin/head can INSERT or UPDATE. SELECT stays
--    open (campus listings). No DELETE policy = deletes stay blocked.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can create opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can update own opportunities" ON opportunities;

CREATE POLICY "Staff can create opportunities"
  ON opportunities FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role::text IN ('alumni', 'admin', 'head')
    )
  );

CREATE POLICY "Staff can update opportunities"
  ON opportunities FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role::text IN ('alumni', 'admin', 'head')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role::text IN ('alumni', 'admin', 'head')
    )
  );

-- ------------------------------------------------------------
-- 3. resumes — RLS status was undocumented. These policies encode the
--    intended shape: owners manage their own resume; ranking readers
--    (alumni/admin/head) can read all. BEFORE running, check for
--    conflicting permissive policies in Dashboard → Authentication →
--    Policies → resumes, and drop them if present.
-- ------------------------------------------------------------
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Staff can read all resumes" ON public.resumes;

CREATE POLICY "Users manage own resumes"
  ON public.resumes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can read all resumes"
  ON public.resumes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role::text IN ('alumni', 'admin', 'head')
    )
  );
