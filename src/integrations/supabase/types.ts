export type Json = string | number | boolean | null | {
  [key: string]: Json | undefined;
} | Json[];
export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      data_quality_logs: {
        Row: {
          accuracy_score: number | null;
          completeness_score: number | null;
          consistency_score: number | null;
          created_at: string | null;
          data_source: string;
          freshness_score: number | null;
          id: string;
          issues_found: Json | null;
        };
        Insert: {
          accuracy_score?: number | null;
          completeness_score?: number | null;
          consistency_score?: number | null;
          created_at?: string | null;
          data_source: string;
          freshness_score?: number | null;
          id?: string;
          issues_found?: Json | null;
        };
        Update: {
          accuracy_score?: number | null;
          completeness_score?: number | null;
          consistency_score?: number | null;
          created_at?: string | null;
          data_source?: string;
          freshness_score?: number | null;
          id?: string;
          issues_found?: Json | null;
        };
        Relationships: [];
      };
      job_execution_logs: {
        Row: {
          created_at: string | null;
          end_time: string | null;
          error_message: string | null;
          execution_time_ms: number | null;
          id: string;
          job_name: string;
          start_time: string;
          status: string | null;
        };
        Insert: {
          created_at?: string | null;
          end_time?: string | null;
          error_message?: string | null;
          execution_time_ms?: number | null;
          id?: string;
          job_name: string;
          start_time: string;
          status?: string | null;
        };
        Update: {
          created_at?: string | null;
          end_time?: string | null;
          error_message?: string | null;
          execution_time_ms?: number | null;
          id?: string;
          job_name?: string;
          start_time?: string;
          status?: string | null;
        };
        Relationships: [];
      };
      leagues: {
        Row: {
          id: string;
          league_type: string;
          match_count: number | null;
          season_number: number;
          uploaded_at: string | null;
        };
        Insert: {
          id?: string;
          league_type: string;
          match_count?: number | null;
          season_number: number;
          uploaded_at?: string | null;
        };
        Update: {
          id?: string;
          league_type?: string;
          match_count?: number | null;
          season_number?: number;
          uploaded_at?: string | null;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          away_team: string;
          created_at: string | null;
          full_time_away_goals: number;
          full_time_home_goals: number;
          half_time_away_goals: number;
          half_time_home_goals: number;
          home_team: string;
          id: string;
          league_id: string | null;
          match_time: string;
        };
        Insert: {
          away_team: string;
          created_at?: string | null;
          full_time_away_goals: number;
          full_time_home_goals: number;
          half_time_away_goals: number;
          half_time_home_goals: number;
          home_team: string;
          id?: string;
          league_id?: string | null;
          match_time: string;
        };
        Update: {
          away_team?: string;
          created_at?: string | null;
          full_time_away_goals?: number;
          full_time_home_goals?: number;
          half_time_away_goals?: number;
          half_time_home_goals?: number;
          home_team?: string;
          id?: string;
          league_id?: string | null;
          match_time?: string;
        };
        Relationships: [{
          foreignKeyName: "matches_league_id_fkey";
          columns: ["league_id"];
          isOneToOne: false;
          referencedRelation: "leagues";
          referencedColumns: ["id"];
        }];
      };
      model_performance: {
        Row: {
          accuracy: number | null;
          correct_predictions: number | null;
          f1_score: number | null;
          id: string;
          last_updated: string | null;
          model_name: string;
          model_version: string;
          precision_score: number | null;
          recall_score: number | null;
          time_period: string;
          total_predictions: number | null;
        };
        Insert: {
          accuracy?: number | null;
          correct_predictions?: number | null;
          f1_score?: number | null;
          id?: string;
          last_updated?: string | null;
          model_name: string;
          model_version: string;
          precision_score?: number | null;
          recall_score?: number | null;
          time_period: string;
          total_predictions?: number | null;
        };
        Update: {
          accuracy?: number | null;
          correct_predictions?: number | null;
          f1_score?: number | null;
          id?: string;
          last_updated?: string | null;
          model_name?: string;
          model_version?: string;
          precision_score?: number | null;
          recall_score?: number | null;
          time_period?: string;
          total_predictions?: number | null;
        };
        Relationships: [];
      };
      predictions: {
        Row: {
          accuracy_score: number | null;
          actual_away_goals: number | null;
          actual_home_goals: number | null;
          actual_winner: string | null;
          confidence: number | null;
          created_at: string | null;
          css_score: number | null;
          evaluated_at: string | null;
          id: string;
          match_id: string | null;
          model_version: string | null;
          predicted_away_goals: number | null;
          predicted_home_goals: number | null;
          predicted_winner: string | null;
          prediction_factors: Json | null;
        };
        Insert: {
          accuracy_score?: number | null;
          actual_away_goals?: number | null;
          actual_home_goals?: number | null;
          actual_winner?: string | null;
          confidence?: number | null;
          created_at?: string | null;
          css_score?: number | null;
          evaluated_at?: string | null;
          id?: string;
          match_id?: string | null;
          model_version?: string | null;
          predicted_away_goals?: number | null;
          predicted_home_goals?: number | null;
          predicted_winner?: string | null;
          prediction_factors?: Json | null;
        };
        Update: {
          accuracy_score?: number | null;
          actual_away_goals?: number | null;
          actual_home_goals?: number | null;
          actual_winner?: string | null;
          confidence?: number | null;
          created_at?: string | null;
          css_score?: number | null;
          evaluated_at?: string | null;
          id?: string;
          match_id?: string | null;
          model_version?: string | null;
          predicted_away_goals?: number | null;
          predicted_home_goals?: number | null;
          predicted_winner?: string | null;
          prediction_factors?: Json | null;
        };
        Relationships: [{
          foreignKeyName: "predictions_match_id_fkey";
          columns: ["match_id"];
          isOneToOne: false;
          referencedRelation: "matches";
          referencedColumns: ["id"];
        }];
      };
      scheduled_jobs: {
        Row: {
          created_at: string | null;
          failure_count: number | null;
          id: string;
          job_name: string;
          last_run: string | null;
          next_run: string | null;
          priority: number | null;
          schedule: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          failure_count?: number | null;
          id?: string;
          job_name: string;
          last_run?: string | null;
          next_run?: string | null;
          priority?: number | null;
          schedule: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          failure_count?: number | null;
          id?: string;
          job_name?: string;
          last_run?: string | null;
          next_run?: string | null;
          priority?: number | null;
          schedule?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      team_patterns: {
        Row: {
          confidence: number | null;
          detected_at: string | null;
          expires_at: string | null;
          id: string;
          pattern_data: Json;
          pattern_type: string;
          team_name: string;
        };
        Insert: {
          confidence?: number | null;
          detected_at?: string | null;
          expires_at?: string | null;
          id?: string;
          pattern_data: Json;
          pattern_type: string;
          team_name: string;
        };
        Update: {
          confidence?: number | null;
          detected_at?: string | null;
          expires_at?: string | null;
          id?: string;
          pattern_data?: Json;
          pattern_type?: string;
          team_name?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];
export type Tables<DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | {
  schema: keyof DatabaseWithoutInternals;
}, TableName extends (DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]) : never) = never> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
  Row: infer R;
} ? R : never : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
  Row: infer R;
} ? R : never : never;
export type TablesInsert<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
  schema: keyof DatabaseWithoutInternals;
}, TableName extends (DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never) = never> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
  Insert: infer I;
} ? I : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
  Insert: infer I;
} ? I : never : never;
export type TablesUpdate<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
  schema: keyof DatabaseWithoutInternals;
}, TableName extends (DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never) = never> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
  Update: infer U;
} ? U : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
  Update: infer U;
} ? U : never : never;
export type Enums<DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | {
  schema: keyof DatabaseWithoutInternals;
}, EnumName extends (DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"] : never) = never> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName] : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions] : never;
export type CompositeTypes<PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | {
  schema: keyof DatabaseWithoutInternals;
}, CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] : never) = never> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName] : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions] : never;
export const Constants = {
  public: {
    Enums: {}
  }
} as const;