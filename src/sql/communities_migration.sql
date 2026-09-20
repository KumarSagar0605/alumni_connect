-- =====================================================
-- COMMUNITIES SYSTEM MIGRATION
-- Run this after role_management_migration.sql
-- =====================================================

-- 1. COMMUNITIES TABLE
CREATE TABLE IF NOT EXISTS communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image text DEFAULT '',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. COMMUNITY MEMBERS TABLE (leads + members)
CREATE TABLE IF NOT EXISTS community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(community_id, profile_id)
);

-- 3. COMMUNITY POSTS TABLE (events, announcements, updates)
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  post_type text NOT NULL DEFAULT 'update' CHECK (post_type IN ('event', 'announcement', 'update')),
  image text DEFAULT '',
  event_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_profile ON community_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_community_members_role ON community_members(role);
CREATE INDEX IF NOT EXISTS idx_community_posts_community ON community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);

-- 5. RLS POLICIES

-- Enable RLS on all new tables
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- === COMMUNITIES ===
-- Anyone authenticated can read
CREATE POLICY "communities_select_all" ON communities
  FOR SELECT TO authenticated USING (true);

-- Only admin/head can create
CREATE POLICY "communities_insert_admin" ON communities
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'head')
      LIMIT 1
    )
  );

-- Only admin/head can update
CREATE POLICY "communities_update_admin" ON communities
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'head')
      LIMIT 1
    )
  );

-- Only admin can delete
CREATE POLICY "communities_delete_admin" ON communities
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      LIMIT 1
    )
  );

-- === COMMUNITY MEMBERS ===
-- Anyone authenticated can read
CREATE POLICY "community_members_select_all" ON community_members
  FOR SELECT TO authenticated USING (true);

-- Users can join (insert themselves) or admin/lead can add
CREATE POLICY "community_members_insert_self_or_admin_lead" ON community_members
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND
    (
      -- Self-join: inserting own profile
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = community_members.profile_id
        AND profiles.user_id = auth.uid()
        LIMIT 1
      )
      OR
      -- Admin can add anyone
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'head')
        LIMIT 1
      )
      OR
      -- Lead of this community can add members
      EXISTS (
        SELECT 1 FROM community_members cm
        JOIN profiles p ON p.id = cm.profile_id
        WHERE cm.community_id = community_members.community_id
        AND cm.role = 'lead'
        AND p.user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- Users can leave (delete themselves) or admin/lead can remove
CREATE POLICY "community_members_delete_self_or_admin_lead" ON community_members
  FOR DELETE TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND
    (
      -- Self-leave: deleting own membership
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = community_members.profile_id
        AND profiles.user_id = auth.uid()
        LIMIT 1
      )
      OR
      -- Admin can remove anyone
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'head')
        LIMIT 1
      )
      OR
      -- Lead of this community can remove members
      EXISTS (
        SELECT 1 FROM community_members cm
        JOIN profiles p ON p.id = cm.profile_id
        WHERE cm.community_id = community_members.community_id
        AND cm.role = 'lead'
        AND p.user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- Admin/lead can update role (promote/demote)
CREATE POLICY "community_members_update_admin_lead" ON community_members
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
        SELECT 1 FROM community_members cm
        JOIN profiles p ON p.id = cm.profile_id
        WHERE cm.community_id = community_members.community_id
        AND cm.role = 'lead'
        AND p.user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- === COMMUNITY POSTS ===
-- Anyone authenticated can read
CREATE POLICY "community_posts_select_all" ON community_posts
  FOR SELECT TO authenticated USING (true);

-- Admin or lead of the community can create posts
CREATE POLICY "community_posts_insert_admin_or_lead" ON community_posts
  FOR INSERT TO authenticated
  WITH CHECK (
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
        SELECT 1 FROM community_members cm
        JOIN profiles p ON p.id = cm.profile_id
        WHERE cm.community_id = community_posts.community_id
        AND cm.role = 'lead'
        AND p.user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- Admin or lead of the community can update posts
CREATE POLICY "community_posts_update_admin_or_lead" ON community_posts
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
        SELECT 1 FROM community_members cm
        JOIN profiles p ON p.id = cm.profile_id
        WHERE cm.community_id = community_posts.community_id
        AND cm.role = 'lead'
        AND p.user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- Admin or lead of the community can delete posts
CREATE POLICY "community_posts_delete_admin_or_lead" ON community_posts
  FOR DELETE TO authenticated
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
        SELECT 1 FROM community_members cm
        JOIN profiles p ON p.id = cm.profile_id
        WHERE cm.community_id = community_posts.community_id
        AND cm.role = 'lead'
        AND p.user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- 6. updated_at TRIGGER for communities
CREATE OR REPLACE FUNCTION update_communities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW
  EXECUTE FUNCTION update_communities_updated_at();

CREATE TRIGGER community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_communities_updated_at();
