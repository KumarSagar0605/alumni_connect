-- ============================================================
-- RESET: Drop ALL resumes policies and re-create the correct ones
-- Run this if you get "policy already exists" errors or want to
-- start fresh with the security hardening migration policies.
-- ============================================================

-- Step 1: Drop every existing policy on public.resumes
DROP POLICY IF EXISTS "Authenticated users can view resumes" ON public.resumes;
DROP POLICY IF EXISTS "resumes_crud_own" ON public.resumes;
DROP POLICY IF EXISTS "Students can insert own resume" ON public.resumes;
DROP POLICY IF EXISTS "Students can update own resume" ON public.resumes;
DROP POLICY IF EXISTS "Users manage own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Staff can read all resumes" ON public.resumes;

-- Step 2: Re-enable RLS (safe to run even if already enabled)
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Step 3: Create the two correct, scoped policies

-- Policy 1: Students can ALL commands (SELECT/INSERT/UPDATE/DELETE) 
--          only on their own rows (user_id = auth.uid())
CREATE POLICY "Users manage own resumes"
  ON public.resumes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 2: Staff (alumni/admin/head) can SELECT all resumes
--           (needed for ranking flows, candidate matching, etc.)
CREATE POLICY "Staff can read all resumes"
  ON public.resumes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role::text IN ('alumni', 'admin', 'head')
    )
  );

-- Step 4: Verify (optional - run to see current policies)
-- SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'resumes' AND schemaname = 'public';

SELECT '✅ Resume RLS reset complete. Two policies created:' AS status;
SELECT '1. Users manage own resumes (FOR ALL, student-owned rows)' AS policy_1;
SELECT '2. Staff can read all resumes (FOR SELECT, alumni/admin/head only)' AS policy_2;