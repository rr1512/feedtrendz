import { SocialMediaService } from '../services/socialMediaService'

export interface InstagramBusinessConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

export interface InstagramTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
  refresh_token?: string
  scope?: string
}

export interface InstagramBusinessAccount {
  id: string
  username: string
  account_type: string
  media_count: number
  followers_count: number
  name?: string
  biography?: string
  profile_picture_url?: string
}

export class InstagramBusinessAuth {
  private static config: InstagramBusinessConfig = {
    clientId: process.env.INSTAGRAM_BUSINESS_CLIENT_ID || '',
    clientSecret: process.env.INSTAGRAM_BUSINESS_CLIENT_SECRET || '',
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/social/instagram-business/callback`,
    scopes: [
      'instagram_business_basic',
      'instagram_business_manage_comments',
      'instagram_business_content_publish',
      'instagram_business_manage_insights'
    ]
  }

  // Generate OAuth URL for Instagram Business API
  static generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(','),
      response_type: 'code',
      state: state
    })

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`
  }

  // Exchange authorization code for access token
  static async exchangeCodeForToken(code: string): Promise<InstagramTokenResponse> {
    const tokenData = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirectUri,
      code: code
    })

    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenData.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Instagram token exchange failed: ${response.statusText} - ${errorText}`)
    }

    const tokenResponse = await response.json()

    if (tokenResponse.error) {
      throw new Error(`Instagram OAuth error: ${tokenResponse.error_description || tokenResponse.error}`)
    }

    // Exchange short-lived token for long-lived token
    return await this.exchangeForLongLivedToken(tokenResponse.access_token)
  }

  // Exchange short-lived token for long-lived token (60 days)
  static async exchangeForLongLivedToken(shortLivedToken: string): Promise<InstagramTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: this.config.clientSecret,
      access_token: shortLivedToken
    })

    const response = await fetch(`https://graph.instagram.com/access_token?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Long-lived token exchange failed: ${response.statusText} - ${errorText}`)
    }

    const tokenData = await response.json()

    if (tokenData.error) {
      throw new Error(`Long-lived token error: ${tokenData.error.message || tokenData.error}`)
    }

    return {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'bearer',
      expires_in: tokenData.expires_in || 5184000 // 60 days default
    }
  }

  // Get Instagram Business Account info
  static async getBusinessAccount(accessToken: string): Promise<InstagramBusinessAccount> {
    const response = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count,followers_count,name,biography,profile_picture_url&access_token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to get Instagram Business Account: ${response.statusText} - ${errorText}`)
    }

    const accountData = await response.json()

    if (accountData.error) {
      throw new Error(`Instagram account error: ${accountData.error.message || accountData.error}`)
    }

    // Verify this is a professional account (Business or Creator variants)
    const supportedAccountTypes = [
      'BUSINESS', 
      'CREATOR', 
      'MEDIA_CREATOR',  // Creator account variant (confirmed by Instagram API docs)
      'CONTENT_CREATOR' // Another possible Creator variant
    ]
    
    console.log('Instagram account validation:', {
      accountType: accountData.account_type,
      username: accountData.username,
      isSupported: supportedAccountTypes.includes(accountData.account_type)
    })
    
    if (!supportedAccountTypes.includes(accountData.account_type)) {
      throw new Error(`Instagram account type "${accountData.account_type}" is not supported. Supported types: ${supportedAccountTypes.join(', ')}. Please convert your account to a Professional account (Business or Creator) in Instagram settings.`)
    }

    return accountData
  }

  // Refresh long-lived token (can be done once every 60 days)
  static async refreshLongLivedToken(accessToken: string): Promise<InstagramTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: accessToken
    })

    const response = await fetch(`https://graph.instagram.com/refresh_access_token?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Token refresh failed: ${response.statusText} - ${errorText}`)
    }

    const tokenData = await response.json()

    if (tokenData.error) {
      throw new Error(`Token refresh error: ${tokenData.error.message || tokenData.error}`)
    }

    return {
      access_token: tokenData.access_token,
      token_type: 'bearer',
      expires_in: tokenData.expires_in || 5184000 // 60 days
    }
  }

  // Publish content to Instagram Business Account
  static async publishContent(
    accessToken: string, 
    businessAccountId: string, 
    mediaUrl: string, 
    caption: string, 
    mediaType: 'IMAGE' | 'REELS' | 'CAROUSEL'
  ): Promise<{ id: string; permalink?: string }> {
    try {
      // Step 1: Create media container
      const createContainerUrl = `https://graph.instagram.com/${businessAccountId}/media`
      const containerData: any = {
        access_token: accessToken,
        caption: caption
      }

      // Add media URL based on type
      if (mediaType === 'IMAGE') {
        containerData.image_url = mediaUrl
      } else if (mediaType === 'REELS') {
        containerData.video_url = mediaUrl
        containerData.media_type = 'REELS'
      } else if (mediaType === 'CAROUSEL') {
        // For carousel, this will be handled differently
        // For now, treat as single image
        containerData.image_url = mediaUrl
      }

      console.log('Creating Instagram media container:', {
        businessAccountId,
        mediaType,
        mediaUrl,
        caption: caption.substring(0, 100) + (caption.length > 100 ? '...' : ''),
        endpoint: createContainerUrl,
        hasToken: !!accessToken,
        containerDataKeys: Object.keys(containerData)
      })

      const containerResponse = await fetch(createContainerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(containerData).toString()
      })

      if (!containerResponse.ok) {
        const errorText = await containerResponse.text()
        throw new Error(`Failed to create media container: ${containerResponse.statusText} - ${errorText}`)
      }

      const containerResult = await containerResponse.json()

      if (containerResult.error) {
        throw new Error(`Media container error: ${containerResult.error.message || containerResult.error}`)
      }

      const containerId = containerResult.id

      // Step 2: Publish the media container
      const publishUrl = `https://graph.instagram.com/${businessAccountId}/media_publish`
      const publishData = new URLSearchParams({
        creation_id: containerId,
        access_token: accessToken
      })

      console.log('Publishing Instagram media container:', { containerId })
      console.log('🔄 Starting Instagram video publish (processing may take 30-60s)...')

      // Retry mechanism for video processing (Instagram can take 30-60 seconds for video processing)
      let publishResult: any
      let retryCount = 0
      const maxRetries = 10 // Increase retries
      let retryDelay = 3000 // Start with 3 seconds
      const startTime = Date.now()
      const maxWaitTime = 90000 // 90 seconds max total wait time

      while (retryCount < maxRetries) {
        try {
          const publishResponse = await fetch(publishUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            },
            body: publishData.toString()
          })

          if (!publishResponse.ok) {
            const errorText = await publishResponse.text()
            throw new Error(`Failed to publish media: ${publishResponse.statusText} - ${errorText}`)
          }

          publishResult = await publishResponse.json()

          if (publishResult.error) {
            // Check if it's a "media not ready" error
            if (publishResult.error.code === 9007 && publishResult.error.error_subcode === 2207027) {
              const elapsedTime = Date.now() - startTime
              
              // Only log every 3rd attempt to reduce spam
              if (retryCount === 0 || retryCount % 3 === 0) {
                console.log(`Instagram processing video... Elapsed: ${Math.round(elapsedTime/1000)}s (may take 30-60s)`)
              }
              
              // Check if we've exceeded max wait time
              if (elapsedTime > maxWaitTime) {
                throw new Error(`Instagram video processing timeout after ${Math.round(elapsedTime/1000)} seconds. The video container has been created but Instagram needs more time to process it. You can try again in a few minutes.`)
              }
              
              if (retryCount < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, retryDelay))
                retryCount++
                // Exponential backoff: increase delay for longer videos
                retryDelay = Math.min(retryDelay * 1.5, 10000) // Max 10 seconds
                continue
              }
            }
            throw new Error(`Publish error: ${publishResult.error.message || publishResult.error}`)
          }

          // Success - break out of retry loop
          const elapsedTime = Date.now() - startTime
          console.log(`✅ Instagram video published successfully after ${Math.round(elapsedTime/1000)}s processing`)
          break

        } catch (error: any) {
          if (retryCount >= maxRetries - 1) {
            // Final attempt failed - provide helpful error message
            if (error.message.includes('Media belum siap')) {
              throw new Error(`Instagram video processing timeout. The video has been uploaded but Instagram needs more time to process it. This is normal for larger videos. You can try publishing again in a few minutes, or the post may appear automatically once processing completes.`)
            }
            throw error
          }
          
          // Only log non-processing errors to avoid spam
          if (!error.message.includes('Media ID is not available')) {
            console.log(`Publish attempt ${retryCount + 1} failed:`, error.message.substring(0, 100))
          }
          
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          retryCount++
          // Exponential backoff for general errors too
          retryDelay = Math.min(retryDelay * 1.2, 8000)
        }
      }

      // Get media permalink
      let permalink: string | undefined
      try {
        const mediaResponse = await fetch(
          `https://graph.instagram.com/${publishResult.id}?fields=permalink&access_token=${accessToken}`
        )
        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json()
          permalink = mediaData.permalink
        }
      } catch (error) {
        console.warn('Failed to get media permalink:', error)
      }

      return {
        id: publishResult.id,
        permalink
      }

    } catch (error: any) {
      console.error('Instagram Business publish error:', error)
      throw error
    }
  }
}