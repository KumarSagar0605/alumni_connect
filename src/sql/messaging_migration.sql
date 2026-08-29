-- ============================================================
-- MESSAGING SYSTEM MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. PROJECT_MENTORS junction table
-- Links alumni mentors to projects they choose to mentor
-- ============================================================
CREATE TABLE IF NOT EXISTS project_mentors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, mentor_id)
);

ALTER TABLE project_mentors ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read project_mentors
CREATE POLICY "Authenticated users can view project mentors"
  ON project_mentors FOR SELECT TO authenticated USING (true);

-- Alumni can insert themselves as mentors on any project
CREATE POLICY "Alumni can join as mentors"
  ON project_mentors FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'alumni'
        AND profiles.id = mentor_id
    )
  );

-- Alumni can remove themselves from a project
CREATE POLICY "Alumni can leave mentor role"
  ON project_mentors FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'alumni'
        AND profiles.id = mentor_id
    )
  );

-- 2. CONVERSATIONS table
-- Tracks conversation threads between a student and a mentor on a specific project
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  last_message_text text DEFAULT '',
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Students can see their own conversations
CREATE POLICY "Students can view their own conversations"
  ON conversations FOR SELECT TO authenticated
  USING (
    student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Mentors (alumni) can see conversations where they are the mentor
CREATE POLICY "Mentors can view their mentor conversations"
  ON conversations FOR SELECT TO authenticated
  USING (
    mentor_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Students can create conversations (only with eligible mentors - enforced in app layer)
CREATE POLICY "Students can create conversations"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (
    student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- 3. UPDATE MESSAGES table
-- Add conversation_id column
-- ============================================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- RLS: Users can only see messages in their own conversations
CREATE POLICY "Users can view their own conversation messages"
  ON messages FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      WHERE c.student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
         OR c.mentor_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- RLS: Users can insert messages into their own conversations
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND conversation_id IN (
      SELECT c.id FROM conversations c
      WHERE c.student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
         OR c.mentor_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- RLS: Users can update read status on messages in their conversations
CREATE POLICY "Users can update message read status"
  ON messages FOR UPDATE TO authenticated
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      WHERE c.student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
         OR c.mentor_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- 4. HELPER FUNCTION: Get eligible mentors for a student
-- Returns alumni who are mentors on projects the student is part of
-- ============================================================
CREATE OR REPLACE FUNCTION get_eligible_mentors(student_user_id uuid)
RETURNS TABLE (
  mentor_profile_id uuid,
  mentor_name text,
  mentor_avatar text,
  mentor_role text,
  mentor_user_id uuid,
  project_id uuid,
  project_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id AS mentor_profile_id,
    p.full_name AS mentor_name,
    p.avatar_url AS mentor_avatar,
    p.role AS mentor_role,
    p.user_id AS mentor_user_id,
    pr.id AS project_id,
    pr.name AS project_name
  FROM project_mentors pm
  JOIN profiles p ON p.id = pm.mentor_id
  JOIN projects pr ON pr.id = pm.project_id
  WHERE p.role = 'alumni'
    AND (
      pr.created_by IN (SELECT id FROM profiles WHERE user_id = student_user_id)
      OR
      student_user_id::text = ANY(pr.members)
    )
  ORDER BY p.full_name, pr.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_project_mentors_project ON project_mentors(project_id);
CREATE INDEX IF NOT EXISTS idx_project_mentors_mentor ON project_mentors(mentor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_student ON conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_mentor ON conversations(mentor_profile_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- 6. TRIGGER: Update conversations.last_message_at when a message is inserted
-- ============================================================
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      last_message_text = NEW.text
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- 7. ENABLE REALTIME on messages and conversations
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
