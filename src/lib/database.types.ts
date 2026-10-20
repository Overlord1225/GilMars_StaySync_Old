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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      booking_rules: {
        Row: {
          deposit_amount: number
          id: boolean
          min_advance_days: number
          updated_at: string
        }
        Insert: {
          deposit_amount?: number
          id?: boolean
          min_advance_days?: number
          updated_at?: string
        }
        Update: {
          deposit_amount?: number
          id?: boolean
          min_advance_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          category: Database["public"]["Enums"]["inquiry_category"] | null
          category_source: Database["public"]["Enums"]["category_source"]
          corrected_at: string | null
          corrected_by: string | null
          created_at: string
          guest_id: string
          id: string
          matched_keywords: string[]
          message: string
          original_category:
            | Database["public"]["Enums"]["inquiry_category"]
            | null
          status: Database["public"]["Enums"]["inquiry_status"]
          subject: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["inquiry_category"] | null
          category_source?: Database["public"]["Enums"]["category_source"]
          corrected_at?: string | null
          corrected_by?: string | null
          created_at?: string
          guest_id: string
          id?: string
          matched_keywords?: string[]
          message: string
          original_category?:
            | Database["public"]["Enums"]["inquiry_category"]
            | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          subject?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["inquiry_category"] | null
          category_source?: Database["public"]["Enums"]["category_source"]
          corrected_at?: string | null
          corrected_by?: string | null
          created_at?: string
          guest_id?: string
          id?: string
          matched_keywords?: string[]
          message?: string
          original_category?:
            | Database["public"]["Enums"]["inquiry_category"]
            | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          subject?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_corrected_by_fkey"
            columns: ["corrected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_keywords: {
        Row: {
          category: Database["public"]["Enums"]["inquiry_category"]
          created_at: string
          id: string
          is_active: boolean
          keyword: string
          language: string
          weight: number
        }
        Insert: {
          category: Database["public"]["Enums"]["inquiry_category"]
          created_at?: string
          id?: string
          is_active?: boolean
          keyword: string
          language?: string
          weight?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["inquiry_category"]
          created_at?: string
          id?: string
          is_active?: boolean
          keyword?: string
          language?: string
          weight?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          deposit_amount: number | null
          guest_id: string | null
          id: string
          manual_guest_name: string | null
          notes: string | null
          num_guests: number
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          rescheduled_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: Database["public"]["Enums"]["reservation_source"]
          status: Database["public"]["Enums"]["reservation_status"]
          unit_id: string
          updated_at: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          deposit_amount?: number | null
          guest_id?: string | null
          id?: string
          manual_guest_name?: string | null
          notes?: string | null
          num_guests?: number
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          rescheduled_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: Database["public"]["Enums"]["reservation_source"]
          status?: Database["public"]["Enums"]["reservation_status"]
          unit_id: string
          updated_at?: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          deposit_amount?: number | null
          guest_id?: string | null
          id?: string
          manual_guest_name?: string | null
          notes?: string | null
          num_guests?: number
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          rescheduled_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: Database["public"]["Enums"]["reservation_source"]
          status?: Database["public"]["Enums"]["reservation_status"]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      test_inquiries: {
        Row: {
          created_at: string
          expected_category: Database["public"]["Enums"]["inquiry_category"]
          id: string
          language: string
          message: string
        }
        Insert: {
          created_at?: string
          expected_category: Database["public"]["Enums"]["inquiry_category"]
          id?: string
          language?: string
          message: string
        }
        Update: {
          created_at?: string
          expected_category?: Database["public"]["Enums"]["inquiry_category"]
          id?: string
          language?: string
          message?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          amenities: string[]
          capacity: number
          created_at: string
          description: string | null
          id: string
          image_urls: string[]
          is_active: boolean
          name: string
          price_per_night: number
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          capacity: number
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[]
          is_active?: boolean
          name: string
          price_per_night: number
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[]
          is_active?: boolean
          name?: string
          price_per_night?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      live_categorization_stats: {
        Row: {
          auto_accept_pct: number | null
          corrected: number | null
          total_inquiries: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_airbnb_booking: {
        Args: {
          p_booked_at?: string
          p_check_in: string
          p_check_out: string
          p_guest_name: string
          p_notes?: string
          p_num_guests?: number
          p_unit_id: string
        }
        Returns: {
          check_in: string
          check_out: string
          created_at: string
          deposit_amount: number | null
          guest_id: string | null
          id: string
          manual_guest_name: string | null
          notes: string | null
          num_guests: number
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          rescheduled_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: Database["public"]["Enums"]["reservation_source"]
          status: Database["public"]["Enums"]["reservation_status"]
          unit_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_reservation: {
        Args: { p_reservation_id: string }
        Returns: undefined
      }
      categorize_inquiry: {
        Args: { p_message: string }
        Returns: {
          category: Database["public"]["Enums"]["inquiry_category"]
          matched_keywords: string[]
        }[]
      }
      check_availability: {
        Args: { p_check_in: string; p_check_out: string; p_unit_id: string }
        Returns: boolean
      }
      check_request_status: {
        Args: { p_check_in: string; p_check_out: string; p_unit_id: string }
        Returns: string
      }
      confirm_reservation: {
        Args: { p_reservation_id: string }
        Returns: {
          check_in: string
          check_out: string
          created_at: string
          deposit_amount: number | null
          guest_id: string | null
          id: string
          manual_guest_name: string | null
          notes: string | null
          num_guests: number
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          rescheduled_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: Database["public"]["Enums"]["reservation_source"]
          status: Database["public"]["Enums"]["reservation_status"]
          unit_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_reservation_request: {
        Args: {
          p_check_in: string
          p_check_out: string
          p_notes?: string
          p_num_guests: number
          p_unit_id: string
        }
        Returns: string
      }
      get_blocked_ranges: {
        Args: { p_unit_id: string }
        Returns: {
          check_in: string
          check_out: string
        }[]
      }
      get_booked_ranges:
        | {
            Args: { p_unit_id: string }
            Returns: {
              check_in: string
              check_out: string
            }[]
          }
        | {
            Args: { p_from: string; p_to: string; p_unit_id: string }
            Returns: {
              check_in: string
              check_out: string
            }[]
          }
      get_min_advance_days: { Args: never; Returns: number }
      is_staff: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      manila_today: { Args: never; Returns: string }
      record_deposit: {
        Args: {
          p_amount?: number
          p_method: string
          p_paid_at?: string
          p_reference: string
          p_reservation_id: string
        }
        Returns: {
          check_in: string
          check_out: string
          created_at: string
          deposit_amount: number | null
          guest_id: string | null
          id: string
          manual_guest_name: string | null
          notes: string | null
          num_guests: number
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          rescheduled_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: Database["public"]["Enums"]["reservation_source"]
          status: Database["public"]["Enums"]["reservation_status"]
          unit_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reject_reservation: {
        Args: { p_note?: string; p_reservation_id: string }
        Returns: {
          check_in: string
          check_out: string
          created_at: string
          deposit_amount: number | null
          guest_id: string | null
          id: string
          manual_guest_name: string | null
          notes: string | null
          num_guests: number
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          rescheduled_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: Database["public"]["Enums"]["reservation_source"]
          status: Database["public"]["Enums"]["reservation_status"]
          unit_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reschedule_reservation: {
        Args: {
          p_new_check_in: string
          p_new_check_out: string
          p_new_unit_id?: string
          p_reason?: string
          p_reservation_id: string
        }
        Returns: {
          check_in: string
          check_out: string
          created_at: string
          deposit_amount: number | null
          guest_id: string | null
          id: string
          manual_guest_name: string | null
          notes: string | null
          num_guests: number
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          rescheduled_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: Database["public"]["Enums"]["reservation_source"]
          status: Database["public"]["Enums"]["reservation_status"]
          unit_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      staff_update_reservation_status: {
        Args: {
          p_reservation_id: string
          p_status: Database["public"]["Enums"]["reservation_status"]
        }
        Returns: undefined
      }
      submit_deposit_reference: {
        Args: {
          p_method: string
          p_reference: string
          p_reservation_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      category_source: "auto" | "admin"
      inquiry_category:
        | "booking_request"
        | "availability_inquiry"
        | "general_question"
        | "complaint"
      inquiry_status: "new" | "in_progress" | "resolved"
      reservation_source: "staysync" | "airbnb"
      reservation_status:
        | "pending"
        | "confirmed"
        | "rejected"
        | "cancelled"
        | "completed"
      user_role: "guest" | "admin" | "super_admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      category_source: ["auto", "admin"],
      inquiry_category: [
        "booking_request",
        "availability_inquiry",
        "general_question",
        "complaint",
      ],
      inquiry_status: ["new", "in_progress", "resolved"],
      reservation_source: ["staysync", "airbnb"],
      reservation_status: [
        "pending",
        "confirmed",
        "rejected",
        "cancelled",
        "completed",
      ],
      user_role: ["guest", "admin", "super_admin"],
    },
  },
} as const
