-- Fix signup 500 error: run this in Supabase SQL Editor if signup fails
-- Safe to run even if some objects already exist

-- 1. Ensure enum exists
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'judge', 'participant');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Ensure profiles table exists
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'participant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Safer trigger function (handles role cast errors)
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
  IF role_text IN ('admin', 'judge', 'participant') THEN
    user_role_value := role_text::user_role;
  END IF;

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_role_value
  );

  RETURN NEW;
END;
$$;

-- 4. Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Backfill profiles for users created before the trigger existed
INSERT INTO public.profiles (id, full_name, role)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  'participant'::user_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
