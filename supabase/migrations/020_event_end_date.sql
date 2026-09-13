-- Multi-day event schedule: optional end date for spans and overnight events

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS event_end_date DATE;

COMMENT ON COLUMN competitions.event_date IS 'Start date of the event';
COMMENT ON COLUMN competitions.event_end_date IS 'End date when the event spans multiple days or overnight (e.g. Fri 21:00 – Sat 02:00)';
