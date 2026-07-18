-- Round advancement & leaderboard publishing

ALTER TABLE rounds
  ADD COLUMN IF NOT EXISTS max_advance_leaders INT,
  ADD COLUMN IF NOT EXISTS max_advance_followers INT,
  ADD COLUMN IF NOT EXISTS leaderboard_published BOOLEAN NOT NULL DEFAULT FALSE;

-- Finalized standings per round (computed when admin completes a round)
CREATE TABLE IF NOT EXISTS round_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  role registration_role NOT NULL,
  total_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  average_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  judge_count INT NOT NULL DEFAULT 0,
  rank_in_role INT NOT NULL,
  advanced BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (round_id, registration_id)
);

CREATE INDEX IF NOT EXISTS idx_round_standings_round ON round_standings(round_id);
CREATE INDEX IF NOT EXISTS idx_round_standings_advanced ON round_standings(round_id, advanced);

ALTER TABLE round_standings ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins manage round standings"
  ON round_standings FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Judges can view standings for their competitions
CREATE POLICY "Judges view round standings"
  ON round_standings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rounds rd
      JOIN competitions c ON c.id = rd.competition_id
      WHERE rd.id = round_id
        AND is_judge_for_competition(c.id)
    )
  );

-- Authenticated users see published standings
CREATE POLICY "Published standings visible to authenticated"
  ON round_standings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rounds rd
      WHERE rd.id = round_id AND rd.leaderboard_published = TRUE
    )
  );

-- Anonymous users see published standings
CREATE POLICY "Published standings visible to public"
  ON round_standings FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM rounds rd
      WHERE rd.id = round_id AND rd.leaderboard_published = TRUE
    )
  );

-- Participants can see their own standing
CREATE POLICY "Participants view own standings"
  ON round_standings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_id AND r.user_id = auth.uid()
    )
  );
