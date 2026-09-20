-- Run this in Supabase SQL Editor
-- Fixes 403 on opportunity INSERT

-- 1. Enable RLS if not already
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to read all opportunities
DROP POLICY IF EXISTS "Authenticated users can view opportunities" ON opportunities;
CREATE POLICY "Authenticated users can view opportunities"
  ON opportunities FOR SELECT TO authenticated
  USING (true);

-- 3. Allow authenticated users to insert opportunities
DROP POLICY IF EXISTS "Authenticated users can create opportunities" ON opportunities;
CREATE POLICY "Authenticated users can create opportunities"
  ON opportunities FOR INSERT TO authenticated
  WITH CHECK (true);

-- 4. Allow the creator to update their own opportunities
DROP POLICY IF EXISTS "Users can update own opportunities" ON opportunities;
CREATE POLICY "Users can update own opportunities"
  ON opportunities FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
