-- Ticket purchases (foundation for sales dashboard; checkout/Stripe to follow)

CREATE TYPE ticket_purchase_status AS ENUM ('paid', 'refunded');

CREATE TABLE ticket_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  role registration_role,
  amount_cents INT NOT NULL CHECK (amount_cents >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  status ticket_purchase_status NOT NULL DEFAULT 'paid',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_purchases_competition ON ticket_purchases(competition_id);
CREATE INDEX idx_ticket_purchases_competition_status ON ticket_purchases(competition_id, status);

ALTER TABLE ticket_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers view ticket purchases for own events"
  ON ticket_purchases FOR SELECT TO authenticated
  USING (is_organizer() AND owns_competition(competition_id));

CREATE POLICY "Admins view all ticket purchases"
  ON ticket_purchases FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins manage ticket purchases"
  ON ticket_purchases FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Paid purchases only count toward sales stats
CREATE OR REPLACE VIEW event_ticket_sales AS
SELECT
  competition_id,
  COUNT(*) FILTER (WHERE status = 'paid')::INT AS tickets_sold,
  COALESCE(SUM(amount_cents) FILTER (WHERE status = 'paid'), 0)::BIGINT AS revenue_cents,
  COUNT(*) FILTER (WHERE status = 'paid' AND role = 'leader')::INT AS leader_sold,
  COUNT(*) FILTER (WHERE status = 'paid' AND role = 'follower')::INT AS follower_sold
FROM ticket_purchases
GROUP BY competition_id;

GRANT SELECT ON event_ticket_sales TO authenticated;
