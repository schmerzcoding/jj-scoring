-- Event schedule (all types) and workshop-specific fields

CREATE TYPE dance_style AS ENUM (
  'salsa',
  'bachata',
  'kizomba',
  'zouk',
  'other'
);

CREATE TYPE workshop_level AS ENUM (
  'beginners',
  'improvers',
  'intermediate',
  'advanced',
  'open_level'
);

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS dance_style dance_style,
  ADD COLUMN IF NOT EXISTS dance_style_other TEXT,
  ADD COLUMN IF NOT EXISTS workshop_levels workshop_level[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS instructors TEXT;
