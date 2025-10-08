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
      conversations: {
        Row: {
          created_at: string | null
          id: string
          match_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmic_insights: {
        Row: {
          created_at: string | null
          id: string
          insight: string
          match_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          insight: string
          match_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          insight?: string
          match_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmic_insights_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      interests: {
        Row: {
          category: string | null
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          compatibility_score: number | null
          id: string
          matched_at: string | null
          status: string | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          compatibility_score?: number | null
          id?: string
          matched_at?: string | null
          status?: string | null
          user1_id: string
          user2_id: string
        }
        Update: {
          compatibility_score?: number | null
          id?: string
          matched_at?: string | null
          status?: string | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          id: string
          message_type: string | null
          read_at: string | null
          sender_id: string
          sent_at: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          id?: string
          message_type?: string | null
          read_at?: string | null
          sender_id: string
          sent_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          id?: string
          message_type?: string | null
          read_at?: string | null
          sender_id?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_actions: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          target_user_id: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          target_user_id: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          target_user_id?: string
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
        Relationships: [
          {
            foreignKeyName: "user_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_photos: {
        Row: {
          created_at: string | null
          id: string
          order_index: number | null
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_index?: number | null
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_index?: number | null
          photo_url?: string
          user_id?: string
        }
        Relationships: []
      }
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
