ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
