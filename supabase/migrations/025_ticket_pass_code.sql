ALTER TABLE ticket_purchases
  ADD COLUMN IF NOT EXISTS pass_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS purchase_confirmation_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ticket_purchases_pass_code
  ON ticket_purchases(pass_code)
  WHERE pass_code IS NOT NULL;
