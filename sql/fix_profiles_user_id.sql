-- ============================================================
-- Step 1: Ensure profiles table has this user with correct user_id
-- ============================================================

-- Option A: Simple upsert — insert if no row exists, do nothing if it does
INSERT INTO public.profiles (id, user_id, role)
VALUES ('8ed18419-cceb-49fd-b37e-c60fa963fdf6', '677f862e-2ae0-48d1-b42f-464cdbb7858e', 'student')
ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, role = EXCLUDED.role;

-- Option B (if Option A doesn't work due to schema): Just ensure the row exists
-- If the profiles table already has a row for this user, this does nothing.
-- If it doesn't have a row, it creates one with the matching user_id.