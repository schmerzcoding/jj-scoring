-- Fix signup 500: updated trigger for current schema (organizer role, profile_completed)
-- Run in Supabase SQL Editor if signup returns a server error.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_value user_role := 'participant';
  role_text TEXT;
BEGIN
  role_text := NEW.raw_user_meta_data->>'role';
  IF role_text IN ('admin', 'judge', 'organizer', 'participant') THEN
    user_role_value := role_text::user_role;
  END IF;

  INSERT INTO public.profiles (id, full_name, role, profile_completed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User'),
    user_role_value,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any auth users missing a profile
INSERT INTO public.profiles (id, full_name, role, profile_completed)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'User'),
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'role', '')::user_role,
    'participant'::user_role
  ),
  FALSE
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
