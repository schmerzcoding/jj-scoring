export type UserRole = "admin" | "judge" | "participant";
export type CompetitionStatus =
  | "draft"
  | "open"
  | "closed"
  | "in_progress"
  | "completed";
export type RegistrationRole = "leader" | "follower";
export type RegistrationStatus = "pending" | "approved" | "rejected";
export type RoundRoleType = "leader" | "follower" | "both";
export type RoundStatus = "pending" | "active" | "completed";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Competition {
  id: string;
  name: string;
  description: string | null;
  status: CompetitionStatus;
  registration_open: boolean;
  location: string | null;
  event_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Round {
  id: string;
  competition_id: string;
  name: string;
  order_index: number;
  role_type: RoundRoleType;
  status: RoundStatus;
  max_advance: number | null;
  created_at: string;
}

export interface Registration {
  id: string;
  competition_id: string;
  user_id: string;
  role: RegistrationRole;
  status: RegistrationStatus;
  display_name: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  profile?: Profile;
}

export interface CompetitionJudge {
  id: string;
  competition_id: string;
  judge_id: string;
  assigned_at: string;
  profile?: Profile;
}

export interface Score {
  id: string;
  round_id: string;
  judge_id: string;
  registration_id: string;
  score: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoundResult {
  round_id: string;
  registration_id: string;
  display_name: string | null;
  role: RegistrationRole;
  competition_id: string;
  judge_count: number;
  average_score: number;
  total_score: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id">>;
      };
      competitions: {
        Row: Competition;
        Insert: Omit<Competition, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Competition, "id">>;
      };
      rounds: {
        Row: Round;
        Insert: Omit<Round, "id" | "created_at">;
        Update: Partial<Omit<Round, "id">>;
      };
      registrations: {
        Row: Registration;
        Insert: Omit<
          Registration,
          "id" | "created_at" | "reviewed_at" | "reviewed_by"
        >;
        Update: Partial<Omit<Registration, "id">>;
      };
      competition_judges: {
        Row: CompetitionJudge;
        Insert: Omit<CompetitionJudge, "id" | "assigned_at">;
        Update: Partial<Omit<CompetitionJudge, "id">>;
      };
      scores: {
        Row: Score;
        Insert: Omit<Score, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Score, "id">>;
      };
    };
    Views: {
      round_results: {
        Row: RoundResult;
      };
    };
  };
}
