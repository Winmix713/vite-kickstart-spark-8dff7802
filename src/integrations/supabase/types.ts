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
      crowd_wisdom: {
        Row: {
          avg_confidence_score: number | null
          avg_predicted_away_score: number | null
          avg_predicted_home_score: number | null
          away_win_percentage: number | null
          btts_yes_percentage: number | null
          created_at: string
          draw_percentage: number | null
          home_win_percentage: number | null
          id: string
          last_updated: string
          match_id: string
          over_2_5_percentage: number | null
          total_predictions: number
        }
        Insert: {
          avg_confidence_score?: number | null
          avg_predicted_away_score?: number | null
          avg_predicted_home_score?: number | null
          away_win_percentage?: number | null
          btts_yes_percentage?: number | null
          created_at?: string
          draw_percentage?: number | null
          home_win_percentage?: number | null
          id?: string
          last_updated?: string
          match_id: string
          over_2_5_percentage?: number | null
          total_predictions?: number
        }
        Update: {
          avg_confidence_score?: number | null
          avg_predicted_away_score?: number | null
          avg_predicted_home_score?: number | null
          away_win_percentage?: number | null
          btts_yes_percentage?: number | null
          created_at?: string
          draw_percentage?: number | null
          home_win_percentage?: number | null
          id?: string
          last_updated?: string
          match_id?: string
          over_2_5_percentage?: number | null
          total_predictions?: number
        }
        Relationships: []
      }
      market_odds: {
        Row: {
          away_win_odds: number | null
          bookmaker: string
          btts_no_odds: number | null
          btts_yes_odds: number | null
          created_at: string
          draw_odds: number | null
          home_win_odds: number | null
          id: string
          match_id: string
          over_2_5_odds: number | null
          under_2_5_odds: number | null
          updated_at: string
        }
        Insert: {
          away_win_odds?: number | null
          bookmaker: string
          btts_no_odds?: number | null
          btts_yes_odds?: number | null
          created_at?: string
          draw_odds?: number | null
          home_win_odds?: number | null
          id?: string
          match_id: string
          over_2_5_odds?: number | null
          under_2_5_odds?: number | null
          updated_at?: string
        }
        Update: {
          away_win_odds?: number | null
          bookmaker?: string
          btts_no_odds?: number | null
          btts_yes_odds?: number | null
          created_at?: string
          draw_odds?: number | null
          home_win_odds?: number | null
          id?: string
          match_id?: string
          over_2_5_odds?: number | null
          under_2_5_odds?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_predictions: {
        Row: {
          btts_prediction: boolean | null
          confidence_score: number
          created_at: string
          id: string
          match_id: string
          over_under_prediction: string | null
          predicted_away_score: number | null
          predicted_home_score: number | null
          predicted_outcome: string
          reasoning: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          btts_prediction?: boolean | null
          confidence_score: number
          created_at?: string
          id?: string
          match_id: string
          over_under_prediction?: string | null
          predicted_away_score?: number | null
          predicted_home_score?: number | null
          predicted_outcome: string
          reasoning?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          btts_prediction?: boolean | null
          confidence_score?: number
          created_at?: string
          id?: string
          match_id?: string
          over_under_prediction?: string | null
          predicted_away_score?: number | null
          predicted_home_score?: number | null
          predicted_outcome?: string
          reasoning?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      value_bets: {
        Row: {
          bet_type: string
          bookmaker: string
          confidence_level: string
          correlation_strength: number | null
          created_at: string
          detection_timestamp: string
          expected_value: number
          id: string
          implied_probability: number
          kelly_fraction: number | null
          market_signals: Json | null
          match_id: string
          model_probability: number
          odds: number
        }
        Insert: {
          bet_type: string
          bookmaker: string
          confidence_level: string
          correlation_strength?: number | null
          created_at?: string
          detection_timestamp?: string
          expected_value: number
          id?: string
          implied_probability: number
          kelly_fraction?: number | null
          market_signals?: Json | null
          match_id: string
          model_probability: number
          odds: number
        }
        Update: {
          bet_type?: string
          bookmaker?: string
          confidence_level?: string
          correlation_strength?: number | null
          created_at?: string
          detection_timestamp?: string
          expected_value?: number
          id?: string
          implied_probability?: number
          kelly_fraction?: number | null
          market_signals?: Json | null
          match_id?: string
          model_probability?: number
          odds?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_crowd_wisdom: { Args: { p_match_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
