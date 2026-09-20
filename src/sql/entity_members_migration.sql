-- =====================================================
-- CLUBS / PROJECTS / EVENTS MEMBER MANAGEMENT MIGRATION
-- Run this after communities_migration.sql
-- =====================================================

-- 1. CLUB_MEMBERS TABLE (like community_members)
CREATE TABLE IF NOT EXISTS club_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(club_id, profile_id)
);

-- 2. EVENT_HOSTS TABLE (like community_members)
CREATE TABLE IF NOT EXISTS event_hosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'host' CHECK (role IN ('lead', 'host', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(event_id, profile_id)
);

-- 3. Add role column to project_members (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_members' AND column_name = 'role'
  ) THEN
    ALTER TABLE project_members ADD COLUMN role text NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'member'));
  END IF;
END $$;

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_club_members_club ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_profile ON club_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_club_members_role ON club_members(role);
CREATE INDEX IF NOT EXISTS idx_event_hosts_event ON event_hosts(event_id);
CREATE INDEX IF NOT EXISTS idx_event_hosts_profile ON event_hosts(profile_id);
CREATE INDEX IF NOT EXISTS idx_event_hosts_role ON event_hosts(role);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);

-- 5. RLS POLICIES

ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_hosts ENABLE ROW LEVEL SECURITY;

-- === CLUB_MEMBERS ===
CREATE POLICY "club_members_select_all" ON club_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "club_members_insert_self_or_admin_lead" ON club_members
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = club_members.profile_id
        AND profiles.user_id = auth.uid()
        LIMIT 1
      )
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'head')
        LIMIT 1
      )
      OR
      EXISTS (
        SELECT 1 FROM club_members cm
        JOIN profiles p ON p.id = cm.profile_id
        WHERE cm.club_id = club_members.club_id
        AND cm.role = 'lead'
        AND p.user_id = auth.uid()
        LIMIT 1
      )
    )
  );

CREATE POLICY "club_members_delete_self_or_admin_lead" ON club_members
  FOR DELETE TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = club_members.profile_id
        AND profiles.user_id = auth.uid()
        LIMIT 1
      )
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'head')
        LIMIT 1
      )
      OR
      EXISTS (
        SELECT 1 FROM club_members cm
        JOIN profiles p ON p.id = cm.profile_id
        WHERE cm.club_id = club_members.club_id
        AND cm.role = 'lead'
        AND p.user_id = auth.uid()
        LIMIT 1
      )
    )
  );

CREATE POLICY "club_members_update_admin_lead" ON club_members
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'head')
        LIMIT 1
      )
      OR
      EXISTS (
        SELECT 1 FROM club_members cm
        JOIN profiles p ON p.id = cm.profile_id
        WHERE cm.club_id = club_members.club_id
        AND cm.role = 'lead'
        AND p.user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- === EVENT_HOSTS ===
CREATE POLICY "event_hosts_select_all" ON event_hosts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "event_hosts_insert_self_or_admin_lead" ON event_hosts
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = event_hosts.profile_id
        AND profiles.user_id = auth.uid()
        LIMIT 1
      )
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'head')
        LIMIT 1
      )
      OR
      EXISTS (
        SELECT 1 FROM event_hosts eh
        JOIN profiles p ON p.id = eh.profile_id
        WHERE eh.event_id = event_hosts.event_id
        AND eh.role = 'lead'
        AND p.user_id = auth.uid()
        LIMIT 1
      )
    )
  );

CREATE POLICY "event_hosts_delete_self_or_admin_lead" ON event_hosts
  FOR DELETE TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = event_hosts.profile_id
        AND profiles.user_id = auth.uid()
        LIMIT 1
      )
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'head')
        LIMIT 1
      )
      OR
      EXISTS (
        SELECT 1 FROM event_hosts eh
        JOIN profiles p ON p.id = eh.profile_id
        WHERE eh.event_id = event_hosts.event_id
        AND eh.role = 'lead'
        AND p.user_id = auth.uid()
        LIMIT 1
      )
    )
  );

CREATE POLICY "event_hosts_update_admin_lead" ON event_hosts
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'head')
        LIMIT 1
      )
      OR
      EXISTS (
        SELECT 1 FROM event_hosts eh
        JOIN profiles p ON p.id = eh.profile_id
        WHERE eh.event_id = event_hosts.event_id
        AND eh.role = 'lead'
        AND p.user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- === PROJECT_MEMBERS role update policy ===
-- Allow admin/lead to update role on project_members
CREATE POLICY "project_members_update_admin_lead" ON project_members
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'head')
        LIMIT 1
      )
      OR
      EXISTS (
        SELECT 1 FROM project_members pm
        JOIN profiles p ON p.id = pm.profile_id
        WHERE pm.project_id = project_members.project_id
        AND pm.role = 'lead'
        AND p.user_id = auth.uid()
        LIMIT 1
      )
    )
  );
