-- ============================================================================
-- Communities in Atria — Role management migration
-- ----------------------------------------------------------------------------
-- OBJECTIVE
--   1. Support the appointed `head` role alongside student / alumni / admin.
--   2. Lock clubs / projects / events writes to admin + head via RLS.
--   3. Harden signup: any spoofed role in auth metadata falls back to student.
--   4. Let superadmins promote members to head via the profiles table.
--
-- RUN ORDER (important)
--   Step A:  Run the single ALTER TYPE statement FIRST, on its own
--            (Postgres forbids ADD VALUE inside a transaction block).
--   Step B:  Then run everything from "STEP B" downwards in one go.
-- ============================================================================


-- ============================ STEP A (run first, alone) =====================
ALTER TYPE role ADD VALUE IF NOT EXISTS 'head';
-- NOTE: if your enum is named `user_role` instead of `role`, run this instead:
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'head';


-- ============================ STEP B (run after A) ==========================

-- ----------------------------------------------------------------------------
-- 0. Helper predicate is inlined in each policy (no extra function needed).
--    A caller manages content iff a profiles row exists with
--    user_id = auth.uid() AND role IN ('admin', 'head').
--    Comparisons use ::text so policies keep working regardless of whether
--    the backing enum is named `role` or `user_role`.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- 1. CLUBS / PROJECTS / EVENTS — strict RLS
--    SELECT: every authenticated user may read.
--    INSERT / UPDATE / DELETE: only admin or appointed head.
-- ----------------------------------------------------------------------------
ALTER TABLE public.clubs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events   ENABLE ROW LEVEL SECURITY;

-- ---- clubs ----
DROP POLICY IF EXISTS clubs_select_authenticated ON public.clubs;
CREATE POLICY clubs_select_authenticated
  ON public.clubs FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS clubs_insert_managers ON public.clubs;
CREATE POLICY clubs_insert_managers
  ON public.clubs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role::text IN ('admin', 'head')
    )
  );

DROP POLICY IF EXISTS clubs_update_managers ON public.clubs;
CREATE POLICY clubs_update_managers
  ON public.clubs FOR UPDATE TO authenticated
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

DROP POLICY IF EXISTS clubs_delete_managers ON public.clubs;
CREATE POLICY clubs_delete_managers
  ON public.clubs FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role::text IN ('admin', 'head')
    )
  );

-- ---- projects ----
DROP POLICY IF EXISTS projects_select_authenticated ON public.projects;
CREATE POLICY projects_select_authenticated
  ON public.projects FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS projects_insert_managers ON public.projects;
CREATE POLICY projects_insert_managers
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role::text IN ('admin', 'head')
    )
  );

DROP POLICY IF EXISTS projects_update_managers ON public.projects;
CREATE POLICY projects_update_managers
  ON public.projects FOR UPDATE TO authenticated
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

DROP POLICY IF EXISTS projects_delete_managers ON public.projects;
CREATE POLICY projects_delete_managers
  ON public.projects FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role::text IN ('admin', 'head')
    )
  );

-- ---- events ----
DROP POLICY IF EXISTS events_select_authenticated ON public.events;
CREATE POLICY events_select_authenticated
  ON public.events FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS events_insert_managers ON public.events;
CREATE POLICY events_insert_managers
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role::text IN ('admin', 'head')
    )
  );

DROP POLICY IF EXISTS events_update_managers ON public.events;
CREATE POLICY events_update_managers
  ON public.events FOR UPDATE TO authenticated
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

DROP POLICY IF EXISTS events_delete_managers ON public.events;
CREATE POLICY events_delete_managers
  ON public.events FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role::text IN ('admin', 'head')
    )
  );

-- ----------------------------------------------------------------------------
-- 2. PROFILES — reads for member lists, guarded writes, admin promotion path
--    SELECT: every authenticated user (member lists, mentor cards, lookups).
--    INSERT: a user may only insert their own row (signup trigger bypasses RLS).
--    UPDATE: superadmins may update any row (role promotion/demotion);
--            owners may update their own row but CANNOT change their role.
--    DELETE: no policy (denied for everyone through the API).
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_authenticated ON public.profiles;
CREATE POLICY profiles_select_authenticated
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles a
      WHERE a.user_id = auth.uid() AND a.role::text = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles a
      WHERE a.user_id = auth.uid() AND a.role::text = 'admin'
    )
  );

DROP POLICY IF EXISTS profiles_owner_update ON public.profiles;
CREATE POLICY profiles_owner_update
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- owners may edit their own fields but never escalate their own role
      role::text = (
        SELECT p.role::text FROM public.profiles p
        WHERE p.user_id = auth.uid()
        LIMIT 1
      )
      -- ...unless the caller is a superadmin (covered by the admin policy too)
      OR EXISTS (
        SELECT 1 FROM public.profiles a
        WHERE a.user_id = auth.uid() AND a.role::text = 'admin'
      )
    )
  );

-- ----------------------------------------------------------------------------
-- 3. SIGNUP TRIGGER — spoof-proof default role
--    Only 'student' / 'alumni' from auth metadata are honored; anything else
--    ('admin', 'head', garbage, NULL) safely becomes 'student'.
--    The text value implicitly casts to the role enum on insert.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'student');
  safe_role text := 'student';
BEGIN
  IF requested_role IN ('student', 'alumni') THEN
    safe_role := requested_role;
  ELSE
    safe_role := 'student';
  END IF;

  -- Guarded insert (no ON CONFLICT: profiles.user_id may lack a unique
  -- constraint, and ON CONFLICT would then abort every signup with a 500).
  -- NOTE: safe_role MUST be cast explicitly to the enum. A text *variable*
  -- does not coerce to an enum the way a string literal does, and without
  -- the cast every signup fails with:
  --   column "role" is of type user_role but expression is of type text
  -- The EXCEPTION block guarantees a profile-row problem can never turn
  -- signup itself into a 500; the failure is logged as a WARNING instead.
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
      INSERT INTO public.profiles (user_id, full_name, role)
      VALUES (
        NEW.id,
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1)),
        safe_role::public.user_role
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profile insert failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 4. SEED / PROMOTE (run manually, as needed)
--    Promote the first superadmin (replace the email), then use the in-app
--    Role Manager (My Profile, admin-only card) for further appointments:
--
--    UPDATE public.profiles p
--    SET role = 'admin'
--    FROM auth.users u
--    WHERE p.user_id = u.id AND u.email = 'admin@atria.edu';
-- ----------------------------------------------------------------------------
