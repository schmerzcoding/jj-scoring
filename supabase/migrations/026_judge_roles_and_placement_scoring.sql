-- Step 1 of 2 — run this ALONE in Supabase SQL Editor, then run 027.
-- PostgreSQL cannot use new enum values in the same transaction they are added.

-- Which competitor role this judge scores in placement rounds
ALTER TABLE competition_judges
  ADD COLUMN IF NOT EXISTS judge_role registration_role NOT NULL DEFAULT 'leader';

-- New scoring formats (must be committed before 027 uses them)
ALTER TYPE round_scoring_format ADD VALUE IF NOT EXISTS 'placement';
ALTER TYPE round_scoring_format ADD VALUE IF NOT EXISTS 'crossed_placement';
