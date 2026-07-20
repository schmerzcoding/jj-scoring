-- Extended user profiles (completed after email verification)

CREATE TYPE profile_gender AS ENUM (
  'male',
  'female',
  'non_binary',
  'other',
  'prefer_not_to_say'
);

CREATE TYPE profile_dance_role AS ENUM ('leader', 'follower', 'both');

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS gender profile_gender,
  ADD COLUMN IF NOT EXISTS dance_role profile_dance_role,
  ADD COLUMN IF NOT EXISTS age INT,
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_age_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_age_check
  CHECK (age IS NULL OR (age >= 13 AND age <= 120));

-- Existing users should not be forced through profile setup
UPDATE profiles
SET profile_completed = TRUE
WHERE profile_completed = FALSE;
