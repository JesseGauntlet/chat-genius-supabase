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
      channels: {
        Row: {
          id: string
          name: string
          workspace_id: string
          created_at: string
          is_private: boolean
        }
        Insert: {
          id?: string
          name: string
          workspace_id: string
          created_at?: string
          is_private?: boolean
        }
        Update: {
          id?: string
          name?: string
          workspace_id?: string
          created_at?: string
          is_private?: boolean
        }
      }
      members: {
        Row: {
          id: string
          user_id: string
          workspace_id: string
          channel_id: string | null
          role: 'admin' | 'member' | 'guest'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id: string
          channel_id?: string | null
          role: 'admin' | 'member' | 'guest'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string
          channel_id?: string | null
          role?: 'admin' | 'member' | 'guest'
          created_at?: string
        }
      }
      // Add other table types...
    }
  }
} 