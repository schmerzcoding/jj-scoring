-- J&J Scoring App - Database Schema
-- Run this in Supabase SQL Editor or via supabase db push

-- Custom types
CREATE TYPE user_role AS ENUM ('admin', 'judge', 'participant');
CREATE TYPE competition_status AS ENUM ('draft', 'open', 'closed', 'in_progress', 'completed');
CREATE TYPE registration_role AS ENUM ('leader', 'follower');
CREATE TYPE registration_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE round_role_type AS ENUM ('leader', 'follower', 'both');
CREATE TYPE round_status AS ENUM ('pending', 'active', 'completed');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'participant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Competitions / Events
CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status competition_status NOT NULL DEFAULT 'draft',
  registration_open BOOLEAN NOT NULL DEFAULT FALSE,
  location TEXT,
  event_date DATE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rounds (Phase 1, Phase 2, Semifinal, Final, etc.)
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  role_type round_role_type NOT NULL DEFAULT 'both',
  status round_status NOT NULL DEFAULT 'pending',
  max_advance INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (competition_id, order_index)
);

-- Participant registrations
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role registration_role NOT NULL,
  status registration_status NOT NULL DEFAULT 'pending',
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  UNIQUE (competition_id, user_id)
);

-- Judge assignments per competition
CREATE TABLE competition_judges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (competition_id, judge_id)
);

-- Individual scores from judges
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  score NUMERIC(4,2) NOT NULL CHECK (score >= 0 AND score <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (round_id, judge_id, registration_id)
);

-- Indexes
CREATE INDEX idx_competitions_status ON competitions(status);
CREATE INDEX idx_registrations_competition ON registrations(competition_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_scores_round ON scores(round_id);
CREATE INDEX idx_rounds_competition ON rounds(competition_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'participant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER competitions_updated_at BEFORE UPDATE ON competitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER scores_updated_at BEFORE UPDATE ON scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is judge for a competition
CREATE OR REPLACE FUNCTION is_judge_for_competition(comp_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM competition_judges
    WHERE competition_id = comp_id AND judge_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE TO authenticated
  USING (is_admin());

-- Competitions policies
CREATE POLICY "Anyone authenticated can view competitions"
  ON competitions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage competitions"
  ON competitions FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Rounds policies
CREATE POLICY "Anyone authenticated can view rounds"
  ON rounds FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage rounds"
  ON rounds FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Registrations policies
CREATE POLICY "Users can view registrations for open competitions"
  ON registrations FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin()
    OR is_judge_for_competition(competition_id)
  );

CREATE POLICY "Users can register themselves"
  ON registrations FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM competitions c
      WHERE c.id = competition_id
        AND c.registration_open = true
        AND c.status IN ('open', 'draft')
    )
  );

CREATE POLICY "Admins can manage registrations"
  ON registrations FOR UPDATE TO authenticated
  USING (is_admin());

-- Competition judges policies
CREATE POLICY "Authenticated users can view judge assignments"
  ON competition_judges FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage judge assignments"
  ON competition_judges FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Scores policies
CREATE POLICY "Judges and admins can view scores"
  ON scores FOR SELECT TO authenticated
  USING (
    is_admin()
    OR judge_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Assigned judges can insert scores for active rounds"
  ON scores FOR INSERT TO authenticated
  WITH CHECK (
    judge_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM rounds rd
      JOIN competitions c ON c.id = rd.competition_id
      WHERE rd.id = round_id
        AND rd.status = 'active'
        AND is_judge_for_competition(c.id)
    )
  );

CREATE POLICY "Judges can update own scores for active rounds"
  ON scores FOR UPDATE TO authenticated
  USING (
    judge_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM rounds WHERE id = round_id AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage all scores"
  ON scores FOR ALL TO authenticated
  USING (is_admin());

-- View: round results (average scores per participant)
CREATE OR REPLACE VIEW round_results AS
SELECT
  s.round_id,
  s.registration_id,
  r.display_name,
  r.role,
  r.competition_id,
  COUNT(s.id) AS judge_count,
  ROUND(AVG(s.score)::numeric, 2) AS average_score,
  SUM(s.score) AS total_score
FROM scores s
JOIN registrations r ON r.id = s.registration_id
WHERE r.status = 'approved'
GROUP BY s.round_id, s.registration_id, r.display_name, r.role, r.competition_id;

GRANT SELECT ON round_results TO authenticated;
