-- Multiple ticket / pass types per event + cart checkout grouping

CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INT NOT NULL CHECK (price_cents >= 0),
  pass_type ticket_pass_type NOT NULL DEFAULT 'standard',
  role registration_role,
  sort_order INT NOT NULL DEFAULT 0,
  max_quantity INT CHECK (max_quantity IS NULL OR max_quantity > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_types_competition ON ticket_types(competition_id);
CREATE INDEX idx_ticket_types_competition_active ON ticket_types(competition_id, is_active);

CREATE TABLE checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status ticket_purchase_status NOT NULL DEFAULT 'pending',
  total_cents INT NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checkout_sessions_stripe ON checkout_sessions(stripe_checkout_session_id);
CREATE INDEX idx_checkout_sessions_user ON checkout_sessions(user_id, competition_id);

ALTER TABLE ticket_purchases
  ADD COLUMN IF NOT EXISTS ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS checkout_session_id UUID REFERENCES checkout_sessions(id) ON DELETE SET NULL;

CREATE INDEX idx_ticket_purchases_ticket_type ON ticket_purchases(ticket_type_id);
CREATE INDEX idx_ticket_purchases_checkout_session ON ticket_purchases(checkout_session_id);

ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view ticket types for on-sale events"
  ON ticket_types FOR SELECT TO anon, authenticated
  USING (
    is_active
    AND EXISTS (
      SELECT 1 FROM competitions c
      WHERE c.id = competition_id
        AND c.registration_open
        AND c.status IN ('open', 'in_progress')
    )
  );

CREATE POLICY "Organizers manage ticket types for own events"
  ON ticket_types FOR ALL TO authenticated
  USING (is_organizer() AND owns_competition(competition_id))
  WITH CHECK (is_organizer() AND owns_competition(competition_id));

CREATE POLICY "Admins manage all ticket types"
  ON ticket_types FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users view own checkout sessions"
  ON checkout_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Organizers view checkout sessions for own events"
  ON checkout_sessions FOR SELECT TO authenticated
  USING (is_organizer() AND owns_competition(competition_id));

CREATE POLICY "Admins view all checkout sessions"
  ON checkout_sessions FOR SELECT TO authenticated
  USING (is_admin());

-- Backfill ticket types from legacy competition price columns
INSERT INTO ticket_types (competition_id, name, description, price_cents, pass_type, sort_order)
SELECT
  c.id,
  'General admission',
  NULL,
  c.ticket_price_cents,
  CASE
    WHEN c.event_type = 'social' THEN 'social_pass'::ticket_pass_type
    WHEN c.event_type = 'congress' THEN 'full_pass'::ticket_pass_type
    ELSE 'standard'::ticket_pass_type
  END,
  0
FROM competitions c
WHERE c.ticket_price_cents IS NOT NULL
  AND c.ticket_price_cents > 0;

INSERT INTO ticket_types (competition_id, name, price_cents, pass_type, role, sort_order)
SELECT c.id, 'Leader pass', c.leader_price_cents, 'jj_pass'::ticket_pass_type, 'leader'::registration_role, 0
FROM competitions c
WHERE c.leader_price_cents IS NOT NULL AND c.leader_price_cents > 0;

INSERT INTO ticket_types (competition_id, name, price_cents, pass_type, role, sort_order)
SELECT c.id, 'Follower pass', c.follower_price_cents, 'jj_pass'::ticket_pass_type, 'follower'::registration_role, 1
FROM competitions c
WHERE c.follower_price_cents IS NOT NULL AND c.follower_price_cents > 0;
