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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: Database["public"]["Enums"]["user_role"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: Database["public"]["Enums"]["user_role"];
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
          total_score: number;
          average_score: number;
          judge_count: number;
          rank_in_role: number;
          advanced: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          registration_id: string;
          role: Database["public"]["Enums"]["registration_role"];
          total_score?: number;
          average_score?: number;
          judge_count?: number;
          rank_in_role: number;
          advanced?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          registration_id?: string;
          role?: Database["public"]["Enums"]["registration_role"];
          total_score?: number;
          average_score?: number;
          judge_count?: number;
          rank_in_role?: number;
          advanced?: boolean;
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
      user_role: "admin" | "judge" | "participant";
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
