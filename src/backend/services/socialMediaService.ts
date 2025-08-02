import { supabaseAdmin } from '../config/database'

export interface SocialAccount {
  id: string
  workspace_id: string
  platform: 'facebook' | 'instagram' | 'tiktok' | 'threads' | 'youtube'
  account_name: string
  account_id?: string
  access_token: string
  refresh_token?: string
  expires_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SocialConnectData {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'threads' | 'youtube'
  access_token: string
  refresh_token?: string
  expires_at?: string
  account_name: string
  account_id?: string
}

export class SocialMediaService {
  // Get all social accounts for a workspace
  static async getWorkspaceSocialAccounts(workspaceId: string): Promise<SocialAccount[]> {
    try {
      const { data: accounts, error } = await supabaseAdmin
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to get social accounts: ${error.message}`)
      }

      return accounts || []
    } catch (error) {
      throw error
    }
  }

  // Connect new social media account
  static async connectSocialAccount(workspaceId: string, connectData: SocialConnectData): Promise<SocialAccount> {
    try {
      // Check if account already exists
      const { data: existing } = await supabaseAdmin
        .from('social_accounts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('platform', connectData.platform)
        .eq('account_name', connectData.account_name)
        .single()

      if (existing) {
        // Update existing account
        const { data: updated, error: updateError } = await supabaseAdmin
          .from('social_accounts')
          .update({
            access_token: connectData.access_token,
            refresh_token: connectData.refresh_token,
            expires_at: connectData.expires_at,
            account_id: connectData.account_id,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (updateError) {
          throw new Error(`Failed to update social account: ${updateError.message}`)
        }

        return updated
      }

      // Create new account
      const { data: newAccount, error: insertError } = await supabaseAdmin
        .from('social_accounts')
        .insert({
          workspace_id: workspaceId,
          platform: connectData.platform,
          account_name: connectData.account_name,
          account_id: connectData.account_id,
          access_token: connectData.access_token,
          refresh_token: connectData.refresh_token,
          expires_at: connectData.expires_at,
          is_active: true
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to create social account: ${insertError.message}`)
      }

      return newAccount
    } catch (error) {
      throw error
    }
  }

  // Disconnect social media account
  static async disconnectSocialAccount(accountId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('social_accounts')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId)

      if (error) {
        throw new Error(`Failed to disconnect social account: ${error.message}`)
      }
    } catch (error) {
      throw error
    }
  }

  // Refresh access token
  static async refreshAccessToken(accountId: string, newAccessToken: string, expiresAt?: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('social_accounts')
        .update({
          access_token: newAccessToken,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId)

      if (error) {
        throw new Error(`Failed to refresh access token: ${error.message}`)
      }
    } catch (error) {
      throw error
    }
  }

  // Get social account by ID
  static async getSocialAccountById(accountId: string): Promise<SocialAccount | null> {
    try {
      const { data: account, error } = await supabaseAdmin
        .from('social_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(`Failed to get social account: ${error.message}`)
      }

      return account
    } catch (error) {
      throw error
    }
  }

  // Schedule post
  static async schedulePost(contentId: string, platform: string, scheduledAt: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('scheduled_posts')
        .insert({
          content_id: contentId,
          platform: platform,
          scheduled_at: scheduledAt,
          status: 'scheduled'
        })

      if (error) {
        throw new Error(`Failed to schedule post: ${error.message}`)
      }
    } catch (error) {
      throw error
    }
  }

  // Update scheduled post status
  static async updateScheduledPostStatus(
    postId: string, 
    status: 'published' | 'failed', 
    externalPostId?: string, 
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'published') {
        updateData.published_at = new Date().toISOString()
        if (externalPostId) {
          updateData.post_id = externalPostId
        }
      } else if (status === 'failed' && errorMessage) {
        updateData.error_message = errorMessage
      }

      const { error } = await supabaseAdmin
        .from('scheduled_posts')
        .update(updateData)
        .eq('id', postId)

      if (error) {
        throw new Error(`Failed to update scheduled post: ${error.message}`)
      }
    } catch (error) {
      throw error
    }
  }
}