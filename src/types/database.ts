export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: Database["public"]["Enums"]["user_role"];
          bio: string | null;
          gender: Database["public"]["Enums"]["profile_gender"] | null;
          dance_role: Database["public"]["Enums"]["profile_dance_role"] | null;
          age: number | null;
          profile_completed: boolean;
          avatar_url: string | null;
          country_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: Database["public"]["Enums"]["user_role"];
          bio?: string | null;
          gender?: Database["public"]["Enums"]["profile_gender"] | null;
          dance_role?: Database["public"]["Enums"]["profile_dance_role"] | null;
          age?: number | null;
          profile_completed?: boolean;
          avatar_url?: string | null;
          country_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: Database["public"]["Enums"]["user_role"];
          bio?: string | null;
          gender?: Database["public"]["Enums"]["profile_gender"] | null;
          dance_role?: Database["public"]["Enums"]["profile_dance_role"] | null;
          age?: number | null;
          profile_completed?: boolean;
          avatar_url?: string | null;
          country_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      competitions: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: Database["public"]["Enums"]["competition_status"];
          registration_open: boolean;
          location: string | null;
          event_date: string | null;
          country_code: string | null;
          banner_url: string | null;
          event_type: Database["public"]["Enums"]["event_type"];
          start_time: string | null;
          end_time: string | null;
          dance_style: Database["public"]["Enums"]["dance_style"] | null;
          dance_style_other: string | null;
          workshop_levels: Database["public"]["Enums"]["workshop_level"][];
          instructors: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["competition_status"];
          registration_open?: boolean;
          location?: string | null;
          event_date?: string | null;
          country_code?: string | null;
          banner_url?: string | null;
          event_type?: Database["public"]["Enums"]["event_type"];
          start_time?: string | null;
          end_time?: string | null;
          dance_style?: Database["public"]["Enums"]["dance_style"] | null;
          dance_style_other?: string | null;
          workshop_levels?: Database["public"]["Enums"]["workshop_level"][];
          instructors?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["competition_status"];
          registration_open?: boolean;
          location?: string | null;
          event_date?: string | null;
          country_code?: string | null;
          banner_url?: string | null;
          event_type?: Database["public"]["Enums"]["event_type"];
          start_time?: string | null;
          end_time?: string | null;
          dance_style?: Database["public"]["Enums"]["dance_style"] | null;
          dance_style_other?: string | null;
          workshop_levels?: Database["public"]["Enums"]["workshop_level"][];
          instructors?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rounds: {
        Row: {
          id: string;
          competition_id: string;
          name: string;
          order_index: number;
          role_type: Database["public"]["Enums"]["round_role_type"];
          status: Database["public"]["Enums"]["round_status"];
          max_advance: number | null;
          max_advance_leaders: number | null;
          max_advance_followers: number | null;
          leaderboard_published: boolean;
          scoring_format: Database["public"]["Enums"]["round_scoring_format"];
          created_at: string;
        };
        Insert: {
          id?: string;
          competition_id: string;
          name: string;
          order_index?: number;
          role_type?: Database["public"]["Enums"]["round_role_type"];
          status?: Database["public"]["Enums"]["round_status"];
          max_advance?: number | null;
          max_advance_leaders?: number | null;
          max_advance_followers?: number | null;
          leaderboard_published?: boolean;
          scoring_format?: Database["public"]["Enums"]["round_scoring_format"];
          created_at?: string;
        };
        Update: {
          id?: string;
          competition_id?: string;
          name?: string;
          order_index?: number;
          role_type?: Database["public"]["Enums"]["round_role_type"];
          status?: Database["public"]["Enums"]["round_status"];
          max_advance?: number | null;
          max_advance_leaders?: number | null;
          max_advance_followers?: number | null;
          leaderboard_published?: boolean;
          scoring_format?: Database["public"]["Enums"]["round_scoring_format"];
          created_at?: string;
        };
        Relationships: [];
      };
      round_standings: {
        Row: {
          id: string;
          round_id: string;
          registration_id: string;
          role: Database["public"]["Enums"]["registration_role"];
          display_name: string | null;
          total_score: number;
          average_score: number;
          judge_count: number;
          rank_in_role: number;
          advanced: boolean;
          yes_votes: number;
          coefficient_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          registration_id: string;
          role: Database["public"]["Enums"]["registration_role"];
          display_name?: string | null;
          total_score?: number;
          average_score?: number;
          judge_count?: number;
          rank_in_role: number;
          advanced?: boolean;
          yes_votes?: number;
          coefficient_total?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          registration_id?: string;
          role?: Database["public"]["Enums"]["registration_role"];
          display_name?: string | null;
          total_score?: number;
          average_score?: number;
          judge_count?: number;
          rank_in_role?: number;
          advanced?: boolean;
          yes_votes?: number;
          coefficient_total?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      registrations: {
        Row: {
          id: string;
          competition_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["registration_role"];
          status: Database["public"]["Enums"]["registration_status"];
          display_name: string | null;
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          competition_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["registration_role"];
          status?: Database["public"]["Enums"]["registration_status"];
          display_name?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          id?: string;
          competition_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["registration_role"];
          status?: Database["public"]["Enums"]["registration_status"];
          display_name?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Relationships: [];
      };
      competition_judges: {
        Row: {
          id: string;
          competition_id: string;
          judge_id: string;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          competition_id: string;
          judge_id: string;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          competition_id?: string;
          judge_id?: string;
          assigned_at?: string;
        };
        Relationships: [];
      };
      scores: {
        Row: {
          id: string;
          round_id: string;
          judge_id: string;
          registration_id: string;
          score: number;
          advance_vote: boolean | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          judge_id: string;
          registration_id: string;
          score: number;
          advance_vote?: boolean | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          judge_id?: string;
          registration_id?: string;
          score?: number;
          advance_vote?: boolean | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      round_results: {
        Row: {
          round_id: string;
          registration_id: string;
          display_name: string | null;
          role: Database["public"]["Enums"]["registration_role"];
          competition_id: string;
          judge_count: number;
          average_score: number;
          total_score: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: "admin" | "judge" | "organizer" | "participant";
      competition_status:
        | "draft"
        | "open"
        | "closed"
        | "in_progress"
        | "completed";
      registration_role: "leader" | "follower";
      registration_status: "pending" | "approved" | "rejected";
      round_role_type: "leader" | "follower" | "both";
      round_status: "pending" | "active" | "completed";
      round_scoring_format: "numeric" | "vote_coefficient";
      profile_gender:
        | "male"
        | "female"
        | "non_binary"
        | "other"
        | "prefer_not_to_say";
      profile_dance_role: "leader" | "follower" | "both";
      event_type:
        | "social"
        | "workshop"
        | "masterclass"
        | "congress"
        | "competition";
      dance_style: "salsa" | "bachata" | "kizomba" | "zouk" | "other";
      workshop_level:
        | "beginners"
        | "improvers"
        | "intermediate"
        | "advanced"
        | "open_level";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Convenience aliases used across the app
export type UserRole = Database["public"]["Enums"]["user_role"];
export type CompetitionStatus =
  Database["public"]["Enums"]["competition_status"];
export type RegistrationRole =
  Database["public"]["Enums"]["registration_role"];
export type RegistrationStatus =
  Database["public"]["Enums"]["registration_status"];
export type RoundRoleType = Database["public"]["Enums"]["round_role_type"];
export type RoundStatus = Database["public"]["Enums"]["round_status"];
export type RoundScoringFormat =
  Database["public"]["Enums"]["round_scoring_format"];
export type ProfileGender = Database["public"]["Enums"]["profile_gender"];
export type ProfileDanceRole =
  Database["public"]["Enums"]["profile_dance_role"];
export type EventType = Database["public"]["Enums"]["event_type"];
export type DanceStyle = Database["public"]["Enums"]["dance_style"];
export type WorkshopLevel = Database["public"]["Enums"]["workshop_level"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Competition = Database["public"]["Tables"]["competitions"]["Row"];
export type Round = Database["public"]["Tables"]["rounds"]["Row"];
export type RoundStanding = Database["public"]["Tables"]["round_standings"]["Row"];
export type Registration = Database["public"]["Tables"]["registrations"]["Row"];
export type CompetitionJudge =
  Database["public"]["Tables"]["competition_judges"]["Row"];
export type Score = Database["public"]["Tables"]["scores"]["Row"];
export type RoundResult = Database["public"]["Views"]["round_results"]["Row"];

export type RegistrationWithProfile = Registration & {
  profile: Profile | null;
};

export type CompetitionJudgeWithProfile = CompetitionJudge & {
  profile: Profile | null;
};
