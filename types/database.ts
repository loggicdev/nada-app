export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          age: number | null
          alcohol: string | null
          avatar_url: string | null
          birth_date: string | null
          birth_place: string | null
          birth_time: string | null
          communication_style: string | null
          core_values: string[] | null
          created_at: string | null
          exercise: string | null
          gender: string | null
          id: string
          lifestyle: Json | null
          looking_for: string | null
          name: string | null
          onboarding_completed_at: string | null
          onboarding_current_step: number
          smoking: string | null
          updated_at: string | null
          zodiac_sign: string | null
        }
        Insert: {
          age?: number | null
          alcohol?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          birth_place?: string | null
          birth_time?: string | null
          communication_style?: string | null
          core_values?: string[] | null
          created_at?: string | null
          exercise?: string | null
          gender?: string | null
          id: string
          lifestyle?: Json | null
          looking_for?: string | null
          name?: string | null
          onboarding_completed_at?: string | null
          onboarding_current_step?: number
          smoking?: string | null
          updated_at?: string | null
          zodiac_sign?: string | null
        }
        Update: {
          age?: number | null
          alcohol?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          birth_place?: string | null
          birth_time?: string | null
          communication_style?: string | null
          core_values?: string[] | null
          created_at?: string | null
          exercise?: string | null
          gender?: string | null
          id?: string
          lifestyle?: Json | null
          looking_for?: string | null
          name?: string | null
          onboarding_completed_at?: string | null
          onboarding_current_step?: number
          smoking?: string | null
          updated_at?: string | null
          zodiac_sign?: string | null
        }
        Relationships: []
      }
      user_interests: {
        Row: {
          created_at: string | null
          id: string
          interest: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest?: string
          user_id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          created_at: string | null
          goal: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          goal: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          goal?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
