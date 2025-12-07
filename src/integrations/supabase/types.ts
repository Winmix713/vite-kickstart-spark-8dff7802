export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_quality_logs: {
        Row: {
          accuracy_score: number | null
          completeness_score: number | null
          consistency_score: number | null
          created_at: string | null
          created_by: string | null
          data_source: string
          freshness_score: number | null
          id: string
          issues_detected: Json | null
        }
        Insert: {
          accuracy_score?: number | null
          completeness_score?: number | null
          consistency_score?: number | null
          created_at?: string | null
          created_by?: string | null
          data_source: string
          freshness_score?: number | null
          id?: string
          issues_detected?: Json | null
        }
        Update: {
          accuracy_score?: number | null
          completeness_score?: number | null
          consistency_score?: number | null
          created_at?: string | null
          created_by?: string | null
          data_source?: string
          freshness_score?: number | null
          id?: string
          issues_detected?: Json | null
        }
        Relationships: []
      }
      detected_patterns: {
        Row: {
          confidence_contribution: number
          created_at: string | null
          created_by: string | null
          id: string
          match_id: string
          pattern_data: Json | null
          template_id: string
        }
        Insert: {
          confidence_contribution: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          match_id: string
          pattern_data?: Json | null
          template_id: string
        }
        Update: {
          confidence_contribution?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          match_id?: string
          pattern_data?: Json | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detected_patterns_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detected_patterns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pattern_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_experiments: {
        Row: {
          baseline_accuracy: number | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          experiment_accuracy: number | null
          experiment_name: string
          feature_set: Json
          id: string
          improvement: number | null
          results: Json | null
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          baseline_accuracy?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          experiment_accuracy?: number | null
          experiment_name: string
          feature_set?: Json
          id?: string
          improvement?: number | null
          results?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          baseline_accuracy?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          experiment_accuracy?: number | null
          experiment_name?: string
          feature_set?: Json
          id?: string
          improvement?: number | null
          results?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          feedback_type: string | null
          id: string
          prediction_id: string | null
          rating: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          feedback_type?: string | null
          id?: string
          prediction_id?: string | null
          rating?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          feedback_type?: string | null
          id?: string
          prediction_id?: string | null
          rating?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_execution_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          error_stack: string | null
          id: string
          job_id: string
          records_processed: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          job_id: string
          records_processed?: number | null
          started_at?: string | null
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          job_id?: string
          records_processed?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_execution_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "scheduled_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          avg_goals_per_match: number | null
          btts_percentage: number | null
          country: string
          created_at: string | null
          home_win_percentage: number | null
          id: string
          name: string
          season: string
          updated_at: string | null
        }
        Insert: {
          avg_goals_per_match?: number | null
          btts_percentage?: number | null
          country: string
          created_at?: string | null
          home_win_percentage?: number | null
          id?: string
          name: string
          season: string
          updated_at?: string | null
        }
        Update: {
          avg_goals_per_match?: number | null
          btts_percentage?: number | null
          country?: string
          created_at?: string | null
          home_win_percentage?: number | null
          id?: string
          name?: string
          season?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string
          created_at: string | null
          home_score: number | null
          home_team_id: string
          id: string
          league_id: string
          match_date: string
          status: string
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          created_at?: string | null
          home_score?: number | null
          home_team_id: string
          id?: string
          league_id: string
          match_date: string
          status?: string
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          created_at?: string | null
          home_score?: number | null
          home_team_id?: string
          id?: string
          league_id?: string
          match_date?: string
          status?: string
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      model_performance: {
        Row: {
          accuracy: number | null
          correct_predictions: number | null
          created_at: string | null
          f1_score: number | null
          id: string
          metadata: Json | null
          model_name: string
          model_version: string
          precision_score: number | null
          recall_score: number | null
          total_predictions: number | null
          updated_at: string | null
        }
        Insert: {
          accuracy?: number | null
          correct_predictions?: number | null
          created_at?: string | null
          f1_score?: number | null
          id?: string
          metadata?: Json | null
          model_name: string
          model_version: string
          precision_score?: number | null
          recall_score?: number | null
          total_predictions?: number | null
          updated_at?: string | null
        }
        Update: {
          accuracy?: number | null
          correct_predictions?: number | null
          created_at?: string | null
          f1_score?: number | null
          id?: string
          metadata?: Json | null
          model_name?: string
          model_version?: string
          precision_score?: number | null
          recall_score?: number | null
          total_predictions?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      model_retraining_requests: {
        Row: {
          created_at: string | null
          id: string
          model_name: string
          priority: string | null
          processed_at: string | null
          reason: string | null
          requested_by: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          model_name: string
          priority?: string | null
          processed_at?: string | null
          reason?: string | null
          requested_by: string
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          model_name?: string
          priority?: string | null
          processed_at?: string | null
          reason?: string | null
          requested_by?: string
          status?: string
        }
        Relationships: []
      }
      model_retraining_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          metrics: Json | null
          model_name: string
          started_at: string | null
          status: string
          trigger_reason: string | null
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metrics?: Json | null
          model_name: string
          started_at?: string | null
          status?: string
          trigger_reason?: string | null
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metrics?: Json | null
          model_name?: string
          started_at?: string | null
          status?: string
          trigger_reason?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      pattern_accuracy: {
        Row: {
          accuracy_rate: number | null
          correct_predictions: number | null
          id: string
          last_updated: string | null
          template_id: string
          total_predictions: number | null
        }
        Insert: {
          accuracy_rate?: number | null
          correct_predictions?: number | null
          id?: string
          last_updated?: string | null
          template_id: string
          total_predictions?: number | null
        }
        Update: {
          accuracy_rate?: number | null
          correct_predictions?: number | null
          id?: string
          last_updated?: string | null
          template_id?: string
          total_predictions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pattern_accuracy_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: true
            referencedRelation: "pattern_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_templates: {
        Row: {
          base_confidence_boost: number | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          base_confidence_boost?: number | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          base_confidence_boost?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      prediction_accuracy_daily: {
        Row: {
          accuracy_rate: number | null
          correct_predictions: number | null
          created_at: string | null
          date: string
          id: string
          model_name: string
          total_predictions: number | null
        }
        Insert: {
          accuracy_rate?: number | null
          correct_predictions?: number | null
          created_at?: string | null
          date: string
          id?: string
          model_name: string
          total_predictions?: number | null
        }
        Update: {
          accuracy_rate?: number | null
          correct_predictions?: number | null
          created_at?: string | null
          date?: string
          id?: string
          model_name?: string
          total_predictions?: number | null
        }
        Relationships: []
      }
      prediction_decay_events: {
        Row: {
          affected_predictions: number | null
          created_at: string | null
          decay_rate: number | null
          id: string
          metadata: Json | null
          seven_day_avg_accuracy: number | null
          three_day_accuracy: number | null
          window_end: string
          window_start: string
        }
        Insert: {
          affected_predictions?: number | null
          created_at?: string | null
          decay_rate?: number | null
          id?: string
          metadata?: Json | null
          seven_day_avg_accuracy?: number | null
          three_day_accuracy?: number | null
          window_end: string
          window_start: string
        }
        Update: {
          affected_predictions?: number | null
          created_at?: string | null
          decay_rate?: number | null
          id?: string
          metadata?: Json | null
          seven_day_avg_accuracy?: number | null
          three_day_accuracy?: number | null
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          actual_outcome: string | null
          btts_prediction: boolean | null
          confidence_score: number
          created_at: string | null
          created_by: string | null
          ensemble_breakdown: Json | null
          evaluated_at: string | null
          explanation: string | null
          id: string
          match_id: string
          model_id: string | null
          over_under_prediction: string | null
          predicted_away_score: number | null
          predicted_home_score: number | null
          predicted_outcome: string
          updated_at: string | null
          was_correct: boolean | null
        }
        Insert: {
          actual_outcome?: string | null
          btts_prediction?: boolean | null
          confidence_score: number
          created_at?: string | null
          created_by?: string | null
          ensemble_breakdown?: Json | null
          evaluated_at?: string | null
          explanation?: string | null
          id?: string
          match_id: string
          model_id?: string | null
          over_under_prediction?: string | null
          predicted_away_score?: number | null
          predicted_home_score?: number | null
          predicted_outcome: string
          updated_at?: string | null
          was_correct?: boolean | null
        }
        Update: {
          actual_outcome?: string | null
          btts_prediction?: boolean | null
          confidence_score?: number
          created_at?: string | null
          created_by?: string | null
          ensemble_breakdown?: Json | null
          evaluated_at?: string | null
          explanation?: string | null
          id?: string
          match_id?: string
          model_id?: string | null
          over_under_prediction?: string | null
          predicted_away_score?: number | null
          predicted_home_score?: number | null
          predicted_outcome?: string
          updated_at?: string | null
          was_correct?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "model_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_jobs: {
        Row: {
          config: Json | null
          created_at: string | null
          cron_schedule: string
          enabled: boolean | null
          id: string
          job_name: string
          job_type: string
          last_run_at: string | null
          next_run_at: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          cron_schedule: string
          enabled?: boolean | null
          id?: string
          job_name: string
          job_type: string
          last_run_at?: string | null
          next_run_at?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          cron_schedule?: string
          enabled?: boolean | null
          id?: string
          job_name?: string
          job_type?: string
          last_run_at?: string | null
          next_run_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          component: string
          created_at: string | null
          details: Json | null
          id: string
          message: string | null
          status: string
        }
        Insert: {
          component: string
          created_at?: string | null
          details?: Json | null
          id?: string
          message?: string | null
          status: string
        }
        Update: {
          component?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          message?: string | null
          status?: string
        }
        Relationships: []
      }
      team_patterns: {
        Row: {
          confidence: number | null
          created_at: string | null
          created_by: string | null
          id: string
          last_seen: string | null
          occurrences: number | null
          pattern_data: Json
          pattern_type: string
          team_id: string | null
          team_name: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_seen?: string | null
          occurrences?: number | null
          pattern_data?: Json
          pattern_type: string
          team_id?: string | null
          team_name: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_seen?: string | null
          occurrences?: number | null
          pattern_data?: Json
          pattern_type?: string
          team_id?: string | null
          team_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_patterns_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          founded_year: number | null
          id: string
          league_id: string
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          founded_year?: number | null
          id?: string
          league_id: string
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          founded_year?: number | null
          id?: string
          league_id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          last_login_at?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_template_confidence: {
        Args: { p_adjustment: number; p_template_id: string }
        Returns: undefined
      }
      calculate_confidence_from_patterns: {
        Args: { p_match_id: string }
        Returns: number
      }
      calculate_team_win_probability: {
        Args: { p_is_home: boolean; p_opponent_id: string; p_team_id: string }
        Returns: number
      }
      get_current_user_id: { Args: never; Returns: string }
      get_user_role: { Args: { p_user_id?: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_analyst: { Args: never; Returns: boolean }
      is_predictor: { Args: never; Returns: boolean }
      is_service_role: { Args: never; Returns: boolean }
      update_pattern_accuracy: {
        Args: { p_template_id: string }
        Returns: undefined
      }
      validate_prediction_data: {
        Args: {
          p_confidence: number
          p_match_id: string
          p_predicted_outcome: string
        }
        Returns: {
          error_message: string
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "analyst"
        | "predictor"
        | "team_manager"
        | "viewer"
        | "demo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "analyst",
        "predictor",
        "team_manager",
        "viewer",
        "demo",
      ],
    },
  },
} as const
