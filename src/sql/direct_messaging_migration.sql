-- ============================================================
-- DIRECT MESSAGING MIGRATION
-- Makes conversations.project_id nullable for direct messaging
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Make project_id nullable in conversations table
ALTER TABLE conversations ALTER COLUMN project_id DROP NOT NULL;

-- 2. Drop existing RLS policies on conversations that reference project_id
DROP POLICY IF EXISTS "Students can create conversations" ON conversations;

-- 3. Recreate insert policy without requiring project_id
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (
    student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- 4. Add index for direct conversation lookups
CREATE INDEX IF NOT EXISTS idx_conversations_direct
  ON conversations(student_id, mentor_profile_id)
  WHERE project_id IS NULL;
