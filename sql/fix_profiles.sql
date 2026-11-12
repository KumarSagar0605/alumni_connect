-- Fix: Ensure profiles table has this student with correct user_id matching auth UUID
-- Run this in Supabase Dashboard → SQL Editor

INSERT INTO public.profiles (id, user_id, role)
VALUES ('8ed18419-cceb-49fd-b37e-c60fa963fdf6', '677f862e-2ae0-48d1-b42f-464cdbb7858e', 'student')
ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, role = EXCLUDED.role;

-- Verify (optional):
-- SELECT * FROM public.profiles WHERE id = '8ed18419-cceb-49fd-b37e-c60fa963fdf6';