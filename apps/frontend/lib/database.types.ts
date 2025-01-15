export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string | null
          email: string | null
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          email?: string | null
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          created_at?: string
          last_login?: string | null
        }
      }
      members: {
        Row: {
          id: string
          user_id: string
          channel_id: string
          created_at: string
          role: 'admin' | 'member' | 'guest'
          workspace_id: string
        }
        Insert: {
          id?: string
          user_id: string
          channel_id: string
          created_at?: string
          role?: 'admin' | 'member' | 'guest'
          workspace_id: string
        }
        Update: {
          id?: string
          user_id?: string
          channel_id?: string
          created_at?: string
          role?: 'admin' | 'member' | 'guest'
          workspace_id?: string
        }
        Relationships: {
          user: Database['public']['Tables']['users']['Row']
          channel: Database['public']['Tables']['channels']['Row']
          workspace: Database['public']['Tables']['workspaces']['Row']
        }
      }
      channels: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          is_private: boolean
          workspace_id: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          is_private?: boolean
          workspace_id: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          is_private?: boolean
          workspace_id?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          created_at: string
          owner_id: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          owner_id: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          owner_id?: string
        }
      }
      presence: {
        Row: {
          user_id: string
          status: 'online' | 'away' | 'offline'
          last_seen: string
          custom_status: string | null
        }
        Insert: {
          user_id: string
          status: 'online' | 'away' | 'offline'
          last_seen: string
          custom_status?: string | null
        }
        Update: {
          user_id?: string
          status?: 'online' | 'away' | 'offline'
          last_seen?: string
          custom_status?: string | null
        }
      }
      chat: {
        Row: {
          id: string
          user_id: string
          channel_id: string
          message: Json
          total_replies: number
          is_deleted: boolean
          modified_at: string
          created_at: string
          parent_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          channel_id: string
          message: Json
          total_replies?: number
          is_deleted?: boolean
          modified_at?: string
          created_at?: string
          parent_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          channel_id?: string
          message?: Json
          total_replies?: number
          is_deleted?: boolean
          modified_at?: string
          created_at?: string
          parent_id?: string | null
        }
      }
      emojis: {
        Row: {
          id: string
          user_id: string
          chat_id: string
          emoji_uni_code: string
        }
        Insert: {
          id?: string
          user_id: string
          chat_id: string
          emoji_uni_code: string
        }
        Update: {
          id?: string
          user_id?: string
          chat_id?: string
          emoji_uni_code?: string
        }
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
  }
} 