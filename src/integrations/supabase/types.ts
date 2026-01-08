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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          buccal_corridor_left: number | null
          buccal_corridor_right: number | null
          created_at: string
          facial_midline_deviation_mm: number | null
          facial_symmetry_score: number | null
          facial_thirds_ratio: Json | null
          frontal_rest_url: string | null
          frontal_smile_url: string | null
          gingival_display_mm: number | null
          id: string
          midline_deviation_mm: number | null
          mode: Database["public"]["Enums"]["analysis_mode"]
          raw_ai_payload: Json | null
          smile_score: number | null
          user_id: string
        }
        Insert: {
          buccal_corridor_left?: number | null
          buccal_corridor_right?: number | null
          created_at?: string
          facial_midline_deviation_mm?: number | null
          facial_symmetry_score?: number | null
          facial_thirds_ratio?: Json | null
          frontal_rest_url?: string | null
          frontal_smile_url?: string | null
          gingival_display_mm?: number | null
          id?: string
          midline_deviation_mm?: number | null
          mode?: Database["public"]["Enums"]["analysis_mode"]
          raw_ai_payload?: Json | null
          smile_score?: number | null
          user_id: string
        }
        Update: {
          buccal_corridor_left?: number | null
          buccal_corridor_right?: number | null
          created_at?: string
          facial_midline_deviation_mm?: number | null
          facial_symmetry_score?: number | null
          facial_thirds_ratio?: Json | null
          frontal_rest_url?: string | null
          frontal_smile_url?: string | null
          gingival_display_mm?: number | null
          id?: string
          midline_deviation_mm?: number | null
          mode?: Database["public"]["Enums"]["analysis_mode"]
          raw_ai_payload?: Json | null
          smile_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      analysis_3d: {
        Row: {
          analysis_id: string
          created_at: string
          model_glb_url: string | null
          status_3d: Database["public"]["Enums"]["status_3d"]
          updated_at: string
          wavespeed_task_id: string | null
        }
        Insert: {
          analysis_id: string
          created_at?: string
          model_glb_url?: string | null
          status_3d?: Database["public"]["Enums"]["status_3d"]
          updated_at?: string
          wavespeed_task_id?: string | null
        }
        Update: {
          analysis_id?: string
          created_at?: string
          model_glb_url?: string | null
          status_3d?: Database["public"]["Enums"]["status_3d"]
          updated_at?: string
          wavespeed_task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_3d_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: true
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          flow_order: string | null
          flow_token: string | null
          id: string
          metadata: Json | null
          payment_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          flow_order?: string | null
          flow_token?: string | null
          id?: string
          metadata?: Json | null
          payment_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          flow_order?: string | null
          flow_token?: string | null
          id?: string
          metadata?: Json | null
          payment_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          basic_credits: number
          country: string | null
          created_at: string
          id: string
          plan: Database["public"]["Enums"]["user_plan"]
          premium_credits: number
          role: Database["public"]["Enums"]["user_type"]
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          basic_credits?: number
          country?: string | null
          created_at?: string
          id: string
          plan?: Database["public"]["Enums"]["user_plan"]
          premium_credits?: number
          role?: Database["public"]["Enums"]["user_type"]
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          basic_credits?: number
          country?: string | null
          created_at?: string
          id?: string
          plan?: Database["public"]["Enums"]["user_plan"]
          premium_credits?: number
          role?: Database["public"]["Enums"]["user_type"]
          updated_at?: string
        }
        Relationships: []
      }
      user_coupons: {
        Row: {
          coupon_code: string
          coupon_type: string
          created_at: string
          discount_percent: number
          expires_at: string | null
          id: string
          original_value: number
          redeemed_at: string | null
          user_id: string
        }
        Insert: {
          coupon_code: string
          coupon_type?: string
          created_at?: string
          discount_percent?: number
          expires_at?: string | null
          id?: string
          original_value?: number
          redeemed_at?: string | null
          user_id: string
        }
        Update: {
          coupon_code?: string
          coupon_type?: string
          created_at?: string
          discount_percent?: number
          expires_at?: string | null
          id?: string
          original_value?: number
          redeemed_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_credits: {
        Args: { p_basic?: number; p_premium?: number; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      analysis_mode: "freemium" | "premium"
      app_role: "admin" | "moderator" | "user"
      status_3d: "pending" | "processing" | "completed" | "failed"
      user_plan: "free" | "premium" | "pro"
      user_type: "patient" | "pro"
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
      analysis_mode: ["freemium", "premium"],
      app_role: ["admin", "moderator", "user"],
      status_3d: ["pending", "processing", "completed", "failed"],
      user_plan: ["free", "premium", "pro"],
      user_type: ["patient", "pro"],
    },
  },
} as const
