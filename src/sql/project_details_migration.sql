-- ============================================================================
-- Communities in Atria — Project details persistence + project_members RLS
-- ----------------------------------------------------------------------------
-- 1. Adds milestones / tech_stack / lead columns to projects so the values
--    entered in the creation form are actually stored (previously dropped).
-- 2. Locks down project_members (per-user join tracking):
--    SELECT: every authenticated user (member counts/rosters).
--    INSERT/DELETE: a member may only add/remove their OWN membership;
--                   admins/heads may manage any row.
-- Run in Supabase SQL Editor in one go (all statements are transactional).
-- ============================================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS milestones jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS tech_stack text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS lead text NOT NULL DEFAULT '';

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_members_select_authenticated ON public.project_members;
CREATE POLICY project_members_select_authenticated
  ON public.project_members FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS project_members_insert_own ON public.project_members;
CREATE POLICY project_members_insert_own
  ON public.project_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS project_members_delete_own ON public.project_members;
CREATE POLICY project_members_delete_own
  ON public.project_members FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS project_members_manage_managers ON public.project_members;
CREATE POLICY project_members_manage_managers
  ON public.project_members FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role::text IN ('admin', 'head')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role::text IN ('admin', 'head')
    )
  );
