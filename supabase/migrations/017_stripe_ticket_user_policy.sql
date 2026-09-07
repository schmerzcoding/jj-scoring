-- Allow users to see their own ticket purchases on event pages

CREATE POLICY "Users view own ticket purchases"
  ON ticket_purchases FOR SELECT TO authenticated
  USING (user_id = auth.uid());
