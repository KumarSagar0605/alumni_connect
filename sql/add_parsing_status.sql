-- ============================================================
-- Add parsing_status column to public.resumes
-- Run this in Supabase Dashboard → SQL Editor
--
-- Values:
--   'ai_parsed'        → parsed by Gemini AI (normal path)
--   'partial_fallback' → parsed by the heuristic fallback parser
--                        (AI failed; user should review/complete
--                        experience & projects manually)
--
-- NOTE: ResumeAnalyzer.tsx already retries the insert WITHOUT this
-- column if it is missing, so the upload still works before you
-- run this — but the fallback flag won't persist until you do.
-- ============================================================

ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS parsing_status text DEFAULT 'ai_parsed';

-- Backfill any existing rows
UPDATE public.resumes
SET parsing_status = 'ai_parsed'
WHERE parsing_status IS NULL;

-- Verify
SELECT id, file_name, parsing_status
FROM public.resumes
ORDER BY created_at DESC
LIMIT 10;
