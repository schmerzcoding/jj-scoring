-- Reset all competition data (test cleanup)
-- Run in Supabase SQL Editor when you want a clean slate.
--
-- DELETES: competitions, rounds, registrations, scores, round_standings, competition_judges
-- KEEPS:   profiles, auth users, and all account data
--
-- This cannot be undone. Review before running.

DELETE FROM competitions;

-- Optional: verify cleanup
-- SELECT COUNT(*) AS remaining_competitions FROM competitions;
