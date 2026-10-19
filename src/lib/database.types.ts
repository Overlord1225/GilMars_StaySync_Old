/**
 * Supabase Database types for GilMars StaySync.
 *
 * NOTE: These types are hand-written to match the existing schema
 * (see supabase/migrations/). Run `supabase gen types typescript` to
 * regenerate from the live project when the CLI is available, then
 * remove this TODO comment.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string
          contact_number: string | null
          role: Database['public']['Enums']['user_role']
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email: string
          contact_number?: string | null
          role?: Database['public']['Enums']['user_role']
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string
          contact_number?: string | null
          role?: Database['public']['Enums']['user_role']
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      units: {
        Row: {
          id: string
          name: string
          description: string | null
          capacity: number
          price_per_night: number
          amenities: string[]
          image_urls: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          capacity: number
          price_per_night: number
          amenities?: string[]
          image_urls?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          capacity?: number
          price_per_night?: number
          amenities?: string[]
          image_urls?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          unit_id: string
          guest_id: string | null
          manual_guest_name: string | null
          source: Database['public']['Enums']['reservation_source']
          check_in: string
          check_out: string
          num_guests: number
          status: Database['public']['Enums']['reservation_status']
          notes: string | null
          deposit_amount: number | null
          payment_method: string | null
          payment_reference: string | null
          paid_at: string | null
          rescheduled_at: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          unit_id: string
          guest_id?: string | null
          manual_guest_name?: string | null
          source?: Database['public']['Enums']['reservation_source']
          check_in: string
          check_out: string
          num_guests: number
          status?: Database['public']['Enums']['reservation_status']
          notes?: string | null
          deposit_amount?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          paid_at?: string | null
          rescheduled_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          unit_id?: string
          guest_id?: string | null
          manual_guest_name?: string | null
          source?: Database['public']['Enums']['reservation_source']
          check_in?: string
          check_out?: string
          num_guests?: number
          status?: Database['public']['Enums']['reservation_status']
          notes?: string | null
          deposit_amount?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          paid_at?: string | null
          rescheduled_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inquiries: {
        Row: {
          id: string
          guest_id: string
          unit_id: string | null
          subject: string | null
          message: string
          category: Database['public']['Enums']['inquiry_category'] | null
          original_category: Database['public']['Enums']['inquiry_category'] | null
          category_source: Database['public']['Enums']['category_source']
          matched_keywords: string[]
          corrected_by: string | null
          corrected_at: string | null
          status: Database['public']['Enums']['inquiry_status']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guest_id: string
          unit_id?: string | null
          subject?: string | null
          message: string
          category?: Database['public']['Enums']['inquiry_category'] | null
          original_category?: Database['public']['Enums']['inquiry_category'] | null
          category_source?: Database['public']['Enums']['category_source']
          matched_keywords?: string[]
          corrected_by?: string | null
          corrected_at?: string | null
          status?: Database['public']['Enums']['inquiry_status']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          guest_id?: string
          unit_id?: string | null
          subject?: string | null
          message?: string
          category?: Database['public']['Enums']['inquiry_category'] | null
          original_category?: Database['public']['Enums']['inquiry_category'] | null
          category_source?: Database['public']['Enums']['category_source']
          matched_keywords?: string[]
          corrected_by?: string | null
          corrected_at?: string | null
          status?: Database['public']['Enums']['inquiry_status']
          created_at?: string
          updated_at?: string
        }
      }
      inquiry_keywords: {
        Row: {
          id: string
          category: Database['public']['Enums']['inquiry_category']
          keyword: string
          language: string
          weight: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          category: Database['public']['Enums']['inquiry_category']
          keyword: string
          language: string
          weight: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          category?: Database['public']['Enums']['inquiry_category']
          keyword?: string
          language?: string
          weight?: number
          is_active?: boolean
          created_at?: string
        }
      }

      test_inquiries: {
        Row: {
          id: string
          message: string
          expected_category: Database['public']['Enums']['inquiry_category']
          language: string
          created_at: string
        }
        Insert: {
          id?: string
          message: string
          expected_category: Database['public']['Enums']['inquiry_category']
          language: string
          created_at?: string
        }
        Update: {
          id?: string
          message?: string
          expected_category?: Database['public']['Enums']['inquiry_category']
          language?: string
          created_at?: string
        }
      }
      booking_rules: {
        Row: {
          id: boolean
          min_advance_days: number
          deposit_amount: number
          updated_at: string
        }
        Insert: {
          id?: boolean
          min_advance_days: number
          deposit_amount: number
          updated_at?: string
        }
        Update: {
          id?: boolean
          min_advance_days?: number
          deposit_amount?: number
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_staff: {
        Args: {}
        Returns: boolean
      }
      is_super_admin: {
        Args: {}
        Returns: boolean
      }
      categorize_inquiry: {
        Args: { p_message: string }
        Returns: {
          category: Database['public']['Enums']['inquiry_category']
          matched_keywords: string[]
        }[]
      }
      check_availability: {
        Args: {
          p_unit_id: string
          p_check_in: string
          p_check_out: string
        }
        Returns: boolean
      }
      get_blocked_ranges: {
        Args: { p_unit_id: string }
        Returns: {
          check_in: string
          check_out: string
        }[]
      }
      handle_new_user_profile: {
        Args: {
          NEW: Record<string, unknown>
        }
        Returns: Record<string, unknown>
      }
    }
    Enums: {
      user_role: 'guest' | 'admin' | 'super_admin'
      reservation_status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'
      reservation_source: 'staysync' | 'airbnb'
      inquiry_category: 'booking_request' | 'availability_inquiry' | 'general_question' | 'complaint'
      inquiry_status: 'new' | 'in_progress' | 'resolved'
      category_source: 'auto' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

