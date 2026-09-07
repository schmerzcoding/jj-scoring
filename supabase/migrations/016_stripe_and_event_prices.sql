-- Stripe checkout + event pricing (run AFTER 015_ticket_sales.sql)

-- Prices per event (NULL = free / not sold via Stripe yet)
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS ticket_price_cents INT
    CHECK (ticket_price_cents IS NULL OR ticket_price_cents >= 0),
  ADD COLUMN IF NOT EXISTS leader_price_cents INT
    CHECK (leader_price_cents IS NULL OR leader_price_cents >= 0),
  ADD COLUMN IF NOT EXISTS follower_price_cents INT
    CHECK (follower_price_cents IS NULL OR follower_price_cents >= 0);

ALTER TABLE ticket_purchases
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Pending until Stripe webhook confirms payment
ALTER TYPE ticket_purchase_status ADD VALUE IF NOT EXISTS 'pending';
