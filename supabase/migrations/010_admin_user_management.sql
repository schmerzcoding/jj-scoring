-- Admin user management: organizer role + list/delete helpers

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'organizer';

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
  IF NOT is_admin() THEN
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

REVOKE ALL ON FUNCTION admin_list_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_list_users() TO authenticated;

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
    SELECT 1 FROM profiles WHERE id = target_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Cannot delete an admin account';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION admin_delete_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;
