-- Optional buyer-facing processing fee (1.5% + €0.25) on ticket prices
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS pass_fees_to_buyer BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN competitions.pass_fees_to_buyer IS
  'When true, checkout adds 1.5% + €0.25 to each ticket base price.';
