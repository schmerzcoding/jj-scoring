-- Allow visitors without login to browse published competitions
CREATE POLICY "Public can view published competitions"
  ON competitions FOR SELECT TO anon
  USING (status IN ('open', 'closed', 'in_progress', 'completed'));

-- Allow visitors to view rounds of published competitions
CREATE POLICY "Public can view rounds of published competitions"
  ON rounds FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM competitions c
      WHERE c.id = competition_id
        AND c.status IN ('open', 'closed', 'in_progress', 'completed')
    )
  );
