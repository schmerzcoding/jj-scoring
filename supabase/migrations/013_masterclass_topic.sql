-- Optional theme/topic for masterclass events

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS masterclass_topic TEXT;
