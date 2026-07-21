-- Event types and organizer permissions

CREATE TYPE event_type AS ENUM (
  'social',
  'workshop',
  'masterclass',
  'congress',
  'competition'
);

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS event_type event_type NOT NULL DEFAULT 'competition';

CREATE INDEX IF NOT EXISTS idx_competitions_event_type ON competitions(event_type);

CREATE OR REPLACE FUNCTION is_organizer()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'organizer'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION owns_competition(competition_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM competitions c
    WHERE c.id = competition_id AND c.created_by = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizers manage their own events
CREATE POLICY "Organizers can manage own competitions"
  ON competitions FOR ALL TO authenticated
  USING (is_organizer() AND created_by = auth.uid())
  WITH CHECK (is_organizer() AND created_by = auth.uid());

CREATE POLICY "Organizers can manage rounds for own competitions"
  ON rounds FOR ALL TO authenticated
  USING (is_organizer() AND owns_competition(competition_id))
  WITH CHECK (is_organizer() AND owns_competition(competition_id));

CREATE POLICY "Organizers can manage registrations for own competitions"
  ON registrations FOR UPDATE TO authenticated
  USING (is_organizer() AND owns_competition(competition_id));

CREATE POLICY "Organizers can view registrations for own competitions"
  ON registrations FOR SELECT TO authenticated
  USING (is_organizer() AND owns_competition(competition_id));

CREATE POLICY "Organizers can manage judge assignments for own competitions"
  ON competition_judges FOR ALL TO authenticated
  USING (is_organizer() AND owns_competition(competition_id))
  WITH CHECK (is_organizer() AND owns_competition(competition_id));

-- Banner uploads for organizers (path: {competition_id}/...)
CREATE POLICY "Organizers upload competition banners"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'competition-banners'
    AND is_organizer()
    AND owns_competition((split_part(name, '/', 1))::uuid)
  );

CREATE POLICY "Organizers update competition banners"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'competition-banners'
    AND is_organizer()
    AND owns_competition((split_part(name, '/', 1))::uuid)
  );

CREATE POLICY "Organizers delete competition banners"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'competition-banners'
    AND is_organizer()
    AND owns_competition((split_part(name, '/', 1))::uuid)
  );

CREATE POLICY "Organizers manage round standings for own competitions"
  ON round_standings FOR ALL TO authenticated
  USING (
    is_organizer()
    AND EXISTS (
      SELECT 1 FROM rounds r
      WHERE r.id = round_standings.round_id
        AND owns_competition(r.competition_id)
    )
  )
  WITH CHECK (
    is_organizer()
    AND EXISTS (
      SELECT 1 FROM rounds r
      WHERE r.id = round_standings.round_id
        AND owns_competition(r.competition_id)
    )
  );
