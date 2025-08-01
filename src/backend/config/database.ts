import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for frontend operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for backend operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          full_name: string
          avatar_url?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          full_name: string
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          full_name?: string
          avatar_url?: string
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: 'owner' | 'script_writer' | 'video_editor' | 'social_media_manager'
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role: 'owner' | 'script_writer' | 'video_editor' | 'social_media_manager'
          created_at?: string
        }
        Update: {
          role?: 'owner' | 'script_writer' | 'video_editor' | 'social_media_manager'
        }
      }
      content_briefs: {
        Row: {
          id: string
          workspace_id: string
          title: string
          script: string
          caption: string
          note?: string
          label?: string
          status: 'draft' | 'waiting_for_editor' | 'edited' | 'review' | 'revision' | 'approved' | 'scheduled' | 'published'
          created_by: string
          assigned_editor?: string
          assigned_manager?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          title: string
          script: string
          caption: string
          note?: string
          label?: string
          status?: 'draft' | 'waiting_for_editor' | 'edited' | 'review' | 'revision' | 'approved' | 'scheduled' | 'published'
          created_by: string
          assigned_editor?: string
          assigned_manager?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          script?: string
          caption?: string
          note?: string
          label?: string
          status?: 'draft' | 'waiting_for_editor' | 'edited' | 'review' | 'revision' | 'approved' | 'scheduled' | 'published'
          assigned_editor?: string
          assigned_manager?: string
          updated_at?: string
        }
      }
      content_files: {
        Row: {
          id: string
          content_id: string
          file_url: string
          file_name: string
          file_type: string
          file_size: number
          is_editing_material: boolean
          created_at: string
        }
        Insert: {
          id?: string
          content_id: string
          file_url: string
          file_name: string
          file_type: string
          file_size: number
          is_editing_material?: boolean
          created_at?: string
        }
        Update: {
          file_url?: string
          file_name?: string
          file_type?: string
          file_size?: number
        }
      }
      social_accounts: {
        Row: {
          id: string
          workspace_id: string
          platform: 'facebook' | 'instagram' | 'tiktok' | 'threads' | 'youtube'
          account_name: string
          access_token: string
          refresh_token?: string
          expires_at?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          platform: 'facebook' | 'instagram' | 'tiktok' | 'threads' | 'youtube'
          account_name: string
          access_token: string
          refresh_token?: string
          expires_at?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          access_token?: string
          refresh_token?: string
          expires_at?: string
          is_active?: boolean
          updated_at?: string
        }
      }
      scheduled_posts: {
        Row: {
          id: string
          content_id: string
          platform: string
          scheduled_at: string
          status: 'scheduled' | 'published' | 'failed'
          published_at?: string
          post_id?: string
          error_message?: string
          created_at: string
        }
        Insert: {
          id?: string
          content_id: string
          platform: string
          scheduled_at: string
          status?: 'scheduled' | 'published' | 'failed'
          published_at?: string
          post_id?: string
          error_message?: string
          created_at?: string
        }
        Update: {
          status?: 'scheduled' | 'published' | 'failed'
          published_at?: string
          post_id?: string
          error_message?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          workspace_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id: string
          title: string
          message: string
          type?: 'info' | 'success' | 'warning' | 'error'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
      }
    }
  }
}