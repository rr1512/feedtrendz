export interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string[]
}

export interface OAuthTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
}

export interface UserProfile {
  id: string
  name: string
  email?: string
  avatar?: string
  // Enhanced profile data (TikTok specific)
  profile?: {
    username?: string
    bio?: string
    isVerified?: boolean
    profileWebLink?: string
    profileDeepLink?: string
    stats?: {
      followers?: number
      following?: number
      likes?: number
      videos?: number
    }
  }
}

// Facebook OAuth Configuration
export const facebookConfig: OAuthConfig = {
  clientId: process.env.FACEBOOK_APP_ID || '',
  clientSecret: process.env.FACEBOOK_APP_SECRET || '',
  redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/social/facebook/callback`,
  scope: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list']
}

// Instagram OAuth Configuration (Instagram Professional API)
export const instagramConfig: OAuthConfig = {
  clientId: process.env.INSTAGRAM_APP_ID || '',
  clientSecret: process.env.INSTAGRAM_APP_SECRET || '',
  redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/social/instagram/callback`,
  scope: [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement',
    'business_management'
  ]
}

// YouTube OAuth Configuration
export const youtubeConfig: OAuthConfig = {
  clientId: process.env.YOUTUBE_CLIENT_ID || '',
  clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
  redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/social/youtube/callback`,
  scope: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly']
}

// TikTok OAuth Configuration
export const getTikTokConfig = (): OAuthConfig => {
  // Get TikTok credentials from environment
  const rawClientId = process.env.TIKTOK_CLIENT_KEY || ''
  const rawClientSecret = process.env.TIKTOK_CLIENT_SECRET || ''

  // Clean environment variables (remove any accidental prefixes)
  const cleanClientId = rawClientId.replace(/^TIKTOK.*?=/, '').trim()
  const cleanClientSecret = rawClientSecret.replace(/^TIKTOK.*?=/, '').trim()

  // Validate required credentials
  if (!cleanClientId) {
    console.error('TIKTOK_CLIENT_KEY environment variable is missing')
  }
  if (!cleanClientSecret) {
    console.error('TIKTOK_CLIENT_SECRET environment variable is missing')
  }

  // Validate required fields
  if (!cleanClientId) {
    throw new Error('TIKTOK_CLIENT_KEY environment variable is required but not set')
  }

  if (!cleanClientSecret) {
    throw new Error('TIKTOK_CLIENT_SECRET environment variable is required but not set')
  }
  
  return {
    clientId: cleanClientId,
    clientSecret: cleanClientSecret,
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/social/tiktok/callback`,
          scope: [
        'user.info.basic',          // Read a user's profile info (open id, avatar, display name) - Login Kit
        'user.info.profile',        // Read access to profile_web_link, profile_deep_link, bio_description, is_verified
        'user.info.stats',          // Read access to user's statistical data (likes, followers, following, video count)
        'video.upload',             // Share content to creator's account as a draft - Content Posting API  
        'video.publish'             // Directly post content to user's TikTok profile - Content Posting API
      ]
  }
}

// Legacy export for backwards compatibility
export const tiktokConfig: OAuthConfig = getTikTokConfig()

export class SocialAuthUtils {
  // Generate OAuth URL
  static generateAuthUrl(platform: string, state: string): string {
    let config: OAuthConfig
    let baseUrl: string

    switch (platform) {
      case 'facebook':
        config = facebookConfig
        baseUrl = 'https://www.facebook.com/v18.0/dialog/oauth'
        break
      case 'instagram':
        config = instagramConfig
        baseUrl = 'https://www.facebook.com/v18.0/dialog/oauth'
        break
      case 'youtube':
        config = youtubeConfig
        baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
        break
      case 'tiktok':
        config = getTikTokConfig()
        baseUrl = 'https://www.tiktok.com/v2/auth/authorize'
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    // Log OAuth URL generation for debugging
    console.log(`Generating ${platform} OAuth URL`, {
      hasClientId: !!config.clientId,
      redirectUri: config.redirectUri,
      scopeCount: config.scope.length
    })

    // TikTok requires different scope format than other platforms
    const scopeValue = platform === 'tiktok' 
      ? config.scope.join(',')     // TikTok: comma-separated
      : config.scope.join(' ')     // Others: space-separated
    
    const params = new URLSearchParams({
      redirect_uri: config.redirectUri,
      scope: scopeValue,
      response_type: 'code',
      state: state
    })

    // Add client parameter - TikTok uses 'client_key', others use 'client_id'
    if (platform === 'tiktok') {
      params.append('client_key', config.clientId)
    } else {
      params.append('client_id', config.clientId)
    }

    // Log final OAuth URL details
    const clientParam = platform === 'tiktok' ? 'client_key' : 'client_id'
    console.log(`${platform} OAuth URL ready:`, {
      [clientParam]: config.clientId ? '✓ Set' : '✗ Missing',
      scopes: platform === 'tiktok' ? config.scope.join(',') : config.scope.join(' ')
    })

    // Add platform-specific parameters
    switch (platform) {
      case 'youtube':
        params.append('access_type', 'offline')
        params.append('prompt', 'consent')
        break
      case 'tiktok':
        // TikTok doesn't need additional parameters
        // response_type is already set above
        break
    }

    return `${baseUrl}?${params.toString()}`
  }

  // Exchange code for token
  static async exchangeCodeForToken(platform: string, code: string): Promise<OAuthTokenResponse> {
    let config: OAuthConfig
    let tokenUrl: string

    switch (platform) {
      case 'facebook':
      case 'instagram':
        config = platform === 'facebook' ? facebookConfig : instagramConfig
        tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token'
        break
      case 'youtube':
        config = youtubeConfig
        tokenUrl = 'https://oauth2.googleapis.com/token'
        break
      case 'tiktok':
        config = getTikTokConfig()
        // TikTok uses same endpoint for sandbox and production (credential-based sandbox)
        tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/'
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    const params = new URLSearchParams({
      client_secret: config.clientSecret,
      code: code,
      redirect_uri: config.redirectUri
    })

    // Add client parameter - TikTok uses 'client_key', others use 'client_id'
    if (platform === 'tiktok') {
      params.append('client_key', config.clientId)
      params.append('grant_type', 'authorization_code')
    } else {
      params.append('client_id', config.clientId)
      if (platform === 'youtube') {
        params.append('grant_type', 'authorization_code')
      }
    }

          // TikTok uses different format for token exchange
    if (platform === 'tiktok') {
      const tikTokBody = {
        client_key: config.clientId,
        client_secret: config.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri
      }
      
      console.log('TikTok Token Exchange:', {
        endpoint: tokenUrl,
        client_key: config.clientId ? '✓ Set' : '✗ Missing',
        grant_type: 'authorization_code',
        code_received: !!code
      })

      // TikTok requires form-encoded (confirmed by error message)
      const formParams = new URLSearchParams(tikTokBody)
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: formParams.toString()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('TikTok Token Exchange Failed:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        })
        throw new Error(`Token exchange failed: ${errorText}`)
      }

      const tokenData = await response.json()
      
      console.log('TikTok Token Response:', {
        hasAccessToken: !!tokenData.access_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in
      })

      if (tokenData.error) {
        throw new Error(`Token exchange error: ${tokenData.error_description || tokenData.error}`)
      }

      // TikTok may return access token in different field names
      const processedTokenData = {
        access_token: tokenData.access_token || tokenData.accessToken || tokenData.token || tokenData.data?.access_token,
        refresh_token: tokenData.refresh_token || tokenData.refreshToken || tokenData.data?.refresh_token,
        expires_in: tokenData.expires_in || tokenData.expiresIn || tokenData.data?.expires_in,
        scope: tokenData.scope || tokenData.data?.scope,
        token_type: tokenData.token_type || tokenData.tokenType || tokenData.data?.token_type
      }

      return processedTokenData
    } else {
      // Other platforms use form-encoded
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Token exchange failed: ${errorText}`)
      }

      const tokenData = await response.json()

      if (tokenData.error) {
        throw new Error(`Token exchange error: ${tokenData.error_description || tokenData.error}`)
      }

      return tokenData
    }
  }

  // Get Facebook Pages managed by user
  static async getFacebookPages(accessToken: string): Promise<any[]> {
    const response = await fetch(
      'https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,tasks',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get Facebook Pages: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  }

  // Get Instagram Business Accounts linked to Facebook Pages
  static async getInstagramBusinessAccounts(accessToken: string): Promise<any[]> {
    const response = await fetch(
      'https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,name,username,profile_picture_url,followers_count,media_count}',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get Instagram Business Accounts: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Filter only pages that have Instagram Business Accounts
    const instagramAccounts = data.data
      ?.filter((page: any) => page.instagram_business_account)
      ?.map((page: any) => ({
        ...page.instagram_business_account,
        page_id: page.id,
        page_name: page.name,
        page_access_token: page.access_token
      })) || []

    return instagramAccounts
  }

  // Get user profile
  static async getUserProfile(platform: string, accessToken: string): Promise<UserProfile> {
    let apiUrl: string
    let headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`
    }

    switch (platform) {
      case 'facebook':
        apiUrl = 'https://graph.facebook.com/v18.0/me?fields=id,name,email'
        break
      case 'instagram':
        // Get Instagram Business Accounts directly
        apiUrl = 'https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account{id,name,username,profile_picture_url,followers_count}'
        break
      case 'youtube':
        apiUrl = 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true'
        break
      case 'tiktok':
        // Updated with more fields from enhanced scopes
        apiUrl = 'https://open.tiktokapis.com/v2/user/info/?fields=open_id,username,display_name,avatar_url,profile_web_link,profile_deep_link,bio_description,is_verified,follower_count,following_count,likes_count,video_count'
        headers = {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    console.log('Fetching user profile:', {
      platform,
      apiUrl,
      headers,
      accessToken: accessToken.substring(0, 20) + '...'
    })

    const response = await fetch(apiUrl, { headers })

    console.log('User profile response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('User profile error details:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      })
      throw new Error(`Failed to get user profile: ${response.statusText}`)
    }

    const data = await response.json()

    // Transform response based on platform
    switch (platform) {
      case 'facebook':
        return {
          id: data.id,
          name: data.name,
          email: data.email
        }
      case 'instagram':
        // For Instagram, get the first available business account
        const pageWithIG = data.data?.find((page: any) => page.instagram_business_account)
        if (!pageWithIG?.instagram_business_account) {
          throw new Error('No Instagram business account found. Please connect a Facebook Page that has an Instagram Business Account linked.')
        }
        const igAccount = pageWithIG.instagram_business_account
        return {
          id: igAccount.id,
          name: igAccount.username || igAccount.name || 'Instagram Account',
          email: `@${igAccount.username}` // Use username as identifier
        }
      case 'youtube':
        const channel = data.items?.[0]
        if (!channel) {
          throw new Error('No YouTube channel found')
        }
        return {
          id: channel.id,
          name: channel.snippet.title,
          avatar: channel.snippet.thumbnails?.default?.url
        }
      case 'tiktok':
        const tikTokUser = data.data?.user || {}
        return {
          id: tikTokUser.open_id || '',
          name: tikTokUser.display_name || tikTokUser.username || 'TikTok User',
          email: tikTokUser.username ? `@${tikTokUser.username}` : undefined,
          avatar: tikTokUser.avatar_url,
          // Additional profile info from enhanced scopes
          profile: {
            username: tikTokUser.username,
            bio: tikTokUser.bio_description,
            isVerified: tikTokUser.is_verified,
            profileWebLink: tikTokUser.profile_web_link,
            profileDeepLink: tikTokUser.profile_deep_link,
            stats: {
              followers: tikTokUser.follower_count,
              following: tikTokUser.following_count,
              likes: tikTokUser.likes_count,
              videos: tikTokUser.video_count
            }
          }
        }
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
  }

  // Refresh access token
  static async refreshAccessToken(platform: string, refreshToken: string): Promise<OAuthTokenResponse> {
    let config: OAuthConfig
    let tokenUrl: string

    switch (platform) {
      case 'facebook':
      case 'instagram':
        config = platform === 'facebook' ? facebookConfig : instagramConfig
        tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token'
        break
      case 'youtube':
        config = youtubeConfig
        tokenUrl = 'https://oauth2.googleapis.com/token'
        break
      case 'tiktok':
        config = getTikTokConfig()
        tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/'
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`)
    }

    const tokenData = await response.json()

    if (tokenData.error) {
      throw new Error(`Token refresh error: ${tokenData.error_description || tokenData.error}`)
    }

    return tokenData
  }
}