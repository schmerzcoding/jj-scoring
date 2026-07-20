-- Round scoring formats: numeric (0-10) or yes/no vote + coefficient tiebreak

CREATE TYPE round_scoring_format AS ENUM ('numeric', 'vote_coefficient');

ALTER TABLE rounds
  ADD COLUMN IF NOT EXISTS scoring_format round_scoring_format NOT NULL DEFAULT 'numeric';

ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS advance_vote BOOLEAN;

ALTER TABLE round_standings
  ADD COLUMN IF NOT EXISTS yes_votes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coefficient_total NUMERIC(10,2) NOT NULL DEFAULT 0;
