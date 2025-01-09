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
          id: string
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
          workspace_id: string
          channel_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id: string
          channel_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string
          channel_id?: string | null
          created_at?: string
        }
      }
      // Add other table types...
    }
  }
} 