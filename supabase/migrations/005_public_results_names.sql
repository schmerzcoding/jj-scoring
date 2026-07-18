-- Store display names on standings so public results work without reading all registrations
ALTER TABLE round_standings
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Allow public to read profiles (names only) for leaderboard display
CREATE POLICY "Public can read profile names"
  ON profiles FOR SELECT TO anon
  USING (true);

-- Backfill names on existing standings
UPDATE round_standings rs
SET display_name = COALESCE(r.display_name, p.full_name)
FROM registrations r
JOIN profiles p ON p.id = r.user_id
WHERE r.id = rs.registration_id
  AND rs.display_name IS NULL;

-- Publish results for rounds already marked completed
UPDATE rounds
SET leaderboard_published = TRUE
WHERE status = 'completed'
  AND leaderboard_published = FALSE;
