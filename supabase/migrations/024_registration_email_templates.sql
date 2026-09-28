ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS registration_approval_email_subject TEXT,
  ADD COLUMN IF NOT EXISTS registration_approval_email_body TEXT,
  ADD COLUMN IF NOT EXISTS registration_rejection_email_subject TEXT,
  ADD COLUMN IF NOT EXISTS registration_rejection_email_body TEXT;
