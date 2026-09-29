-- Step 2 of 2 — run AFTER 026 has committed successfully.

-- Migrate legacy numeric rounds to placement
UPDATE rounds SET scoring_format = 'placement' WHERE scoring_format = 'numeric';

-- Allow placement values beyond 0–10 (vote coefficient still uses 1–10)
ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_score_check;
ALTER TABLE scores ADD CONSTRAINT scores_score_check CHECK (score >= 0 AND score <= 100);
