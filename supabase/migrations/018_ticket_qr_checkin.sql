-- QR tickets, pass types, and door check-in

CREATE TYPE ticket_pass_type AS ENUM (
  'standard',
  'social_pass',
  'jj_pass',
  'full_pass'
);

ALTER TABLE ticket_purchases
  ADD COLUMN IF NOT EXISTS pass_type ticket_pass_type NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ticket_purchases_qr_token
  ON ticket_purchases(qr_token)
  WHERE qr_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ticket_purchases_competition_checkin
  ON ticket_purchases(competition_id, checked_in_at)
  WHERE status = 'paid';

-- Backfill pass types for existing paid tickets
UPDATE ticket_purchases tp
SET pass_type = CASE
  WHEN c.event_type = 'competition' THEN 'jj_pass'::ticket_pass_type
  WHEN c.event_type = 'social' THEN 'social_pass'::ticket_pass_type
  ELSE 'standard'::ticket_pass_type
END
FROM competitions c
WHERE tp.competition_id = c.id
  AND tp.status = 'paid';

-- Backfill QR tokens for existing paid tickets
UPDATE ticket_purchases
SET qr_token = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
WHERE status = 'paid'
  AND qr_token IS NULL;
