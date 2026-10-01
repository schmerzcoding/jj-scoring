-- Step 2 of 2 — run AFTER 029 has committed successfully.

CREATE OR REPLACE FUNCTION is_pseudo_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'pseudo_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_admin_panel_access()
RETURNS BOOLEAN AS $$
  SELECT is_admin() OR is_pseudo_admin();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role user_role,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_admin_panel_access() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    u.email::TEXT,
    p.full_name,
    p.role,
    p.created_at
  FROM profiles p
  INNER JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

DROP POLICY IF EXISTS "Users can view registrations for open competitions" ON registrations;
CREATE POLICY "Users can view registrations for open competitions"
  ON registrations FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR has_admin_panel_access()
    OR is_judge_for_competition(competition_id)
  );

DROP POLICY IF EXISTS "Judges and admins can view scores" ON scores;
CREATE POLICY "Judges and admins can view scores"
  ON scores FOR SELECT TO authenticated
  USING (
    has_admin_panel_access()
    OR judge_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Pseudo admins view all ticket purchases"
  ON ticket_purchases FOR SELECT TO authenticated
  USING (is_pseudo_admin());

CREATE POLICY "Pseudo admins view all checkout sessions"
  ON checkout_sessions FOR SELECT TO authenticated
  USING (is_pseudo_admin());

CREATE POLICY "Pseudo admins view all ticket types"
  ON ticket_types FOR SELECT TO authenticated
  USING (is_pseudo_admin());

CREATE POLICY "Pseudo admins view round standings"
  ON round_standings FOR SELECT TO authenticated
  USING (is_pseudo_admin());

CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = target_user_id AND role IN ('admin', 'pseudo_admin')
  ) THEN
    RAISE EXCEPTION 'Cannot delete a staff admin account';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
