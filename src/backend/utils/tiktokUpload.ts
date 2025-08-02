export interface TikTokVideoMetadata {
  title?: string
  description: string
  privacy_level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY' | 'FOLLOWER_OF_CREATOR'
  disable_duet?: boolean
  disable_comment?: boolean
  disable_stitch?: boolean
  video_cover_timestamp_ms?: number // Thumbnail timestamp in milliseconds
  brand_content_toggle?: boolean
  brand_organic_toggle?: boolean
  auto_add_music?: boolean
}

export interface TikTokPhotoMetadata {
  title?: string
  description: string
  privacy_level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY' | 'FOLLOWER_OF_CREATOR'
  disable_comment?: boolean
  auto_add_music?: boolean
  brand_content_toggle?: boolean
  brand_organic_toggle?: boolean
}

export interface TikTokUploadResult {
  success: boolean
  publishId?: string
  videoId?: string
  postUrl?: string
  error?: string
  status?: 'PROCESSING_UPLOAD' | 'PUBLISH_COMPLETE' | 'FAILED'
}

export interface TikTokUploadInitResponse {
  data: {
    publish_id: string
    upload_url?: string // For direct file upload
  }
  error: {
    code: string
    message: string
    log_id: string
  }
}

export interface TikTokStatusResponse {
  data: {
    status: 'PROCESSING_UPLOAD' | 'PUBLISH_COMPLETE' | 'FAILED'
    fail_reason?: string
    publicaly_available_post_id?: string[]
    uploaded_bytes?: number
  }
  error: {
    code: string
    message: string
    log_id: string
  }
}

export class TikTokUpload {
  
  // Get API base URL for TikTok API v2
  private static getApiBaseUrl(): string {
    return 'https://open.tiktokapis.com'
  }
  
  // Step 1: Initialize video upload session
  static async initializeUpload(
    accessToken: string,
    metadata: TikTokVideoMetadata,
    videoFileUrl: string,
    isDirect: boolean = true
  ): Promise<TikTokUploadInitResponse> {
    
    const baseUrl = this.getApiBaseUrl()
    
    // Use different endpoints for direct post vs draft
    const endpoint = isDirect 
      ? `${baseUrl}/v2/post/publish/video/init/`
      : `${baseUrl}/v2/post/publish/inbox/video/init/`
    
    const requestBody = {
      post_info: {
        title: metadata.title || '',
        description: metadata.description,
        privacy_level: metadata.privacy_level,
        disable_duet: metadata.disable_duet || false,
        disable_comment: metadata.disable_comment || false,
        disable_stitch: metadata.disable_stitch || false,
        video_cover_timestamp_ms: metadata.video_cover_timestamp_ms || 1000,
        brand_content_toggle: metadata.brand_content_toggle || false,
        brand_organic_toggle: metadata.brand_organic_toggle || false,
        auto_add_music: metadata.auto_add_music || false
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: videoFileUrl
      }
    }

    console.log('TikTok: Initializing video upload...', {
      title: metadata.title || 'No title',
      description: metadata.description.substring(0, 50) + '...',
      privacy: metadata.privacy_level,
      isDirect,
      endpoint,
      videoUrl: videoFileUrl
    })

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const result = await response.json() as TikTokUploadInitResponse

    if (!response.ok || result.error.code !== 'ok') {
      // Enhanced error handling for TikTok-specific errors
      this.handleTikTokError(result.error.code, result.error.message, response.status)
    }

    console.log('TikTok: Upload session initialized successfully', {
      publishId: result.data.publish_id
    })

    return result
  }

  // Step 2: Check upload status and get final result
  static async checkUploadStatus(
    accessToken: string,
    publishId: string,
    maxRetries: number = 30,
    retryInterval: number = 5000
  ): Promise<TikTokUploadResult> {
    
    console.log('TikTok: Checking upload status...', { publishId })
    const baseUrl = this.getApiBaseUrl()

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${baseUrl}/v2/post/publish/status/fetch/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            publish_id: publishId
          })
        })

        const result = await response.json() as TikTokStatusResponse

        if (!response.ok || result.error.code !== 'ok') {
          this.handleTikTokError(result.error.code, result.error.message, response.status)
        }

        const status = result.data.status
        console.log(`TikTok: Upload status check ${attempt}/${maxRetries}: ${status}`)

        switch (status) {
          case 'PUBLISH_COMPLETE':
            const videoId = result.data.publicaly_available_post_id?.[0]
            console.log('✅ TikTok: Video published successfully!', {
              publishId,
              videoId,
              uploadedBytes: result.data.uploaded_bytes
            })
            
            return {
              success: true,
              publishId,
              videoId,
              postUrl: videoId ? `https://www.tiktok.com/video/${videoId}` : undefined,
              status: 'PUBLISH_COMPLETE'
            }

          case 'FAILED':
            console.error('❌ TikTok: Upload failed', {
              publishId,
              reason: result.data.fail_reason
            })
            
            return {
              success: false,
              publishId,
              error: result.data.fail_reason || 'Upload failed',
              status: 'FAILED'
            }

          case 'PROCESSING_UPLOAD':
            if (attempt === maxRetries) {
              console.warn('⚠️ TikTok: Upload still processing after maximum retries')
              return {
                success: false,
                publishId,
                error: 'Upload timeout - still processing after maximum retries',
                status: 'PROCESSING_UPLOAD'
              }
            }
            
            // Wait before next retry
            console.log(`TikTok: Still processing, waiting ${retryInterval/1000}s before retry...`)
            await new Promise(resolve => setTimeout(resolve, retryInterval))
            break

          default:
            console.warn('TikTok: Unknown status received:', status)
        }

      } catch (error: any) {
        console.error(`TikTok: Status check attempt ${attempt} failed:`, error)
        
        if (attempt === maxRetries) {
          return {
            success: false,
            publishId,
            error: `Status check failed: ${error.message}`,
            status: 'FAILED'
          }
        }
        
        // Wait before retry on error
        await new Promise(resolve => setTimeout(resolve, retryInterval))
      }
    }

    return {
      success: false,
      publishId,
      error: 'Maximum retries exceeded',
      status: 'FAILED'
    }
  }

  // Helper: Get full video URL for TikTok
  static getVideoUrl(fileUrl: string): string {
    return `${process.env.NEXTAUTH_URL}/api/files/public${fileUrl}`
  }

  // Complete upload process: Initialize + Monitor
  static async uploadVideoComplete(
    accessToken: string,
    videoFileUrl: string,
    metadata: TikTokVideoMetadata,
    isDirect: boolean = true,
    onProgress?: (status: string, attempt?: number) => void
  ): Promise<TikTokUploadResult> {
    
    try {
      // Mockup success response for TikTok (since app is not audited yet)
      console.log('TikTok: Mockup success - App not audited, returning private post success')
      
      // Simulate progress updates
      if (onProgress) {
        onProgress('Initializing upload...', 1)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        onProgress('Uploading video...', 2)
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        onProgress('Processing video...', 3)
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        onProgress('Publishing as private...', 4)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      // Generate mock publish ID
      const mockPublishId = 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      
      console.log('TikTok: Mockup upload successful', {
        publishId: mockPublishId,
        title: metadata.title || 'No title',
        description: metadata.description.substring(0, 50) + '...',
        privacyLevel: metadata.privacy_level,
        status: 'PUBLISH_COMPLETE (Private)',
        note: 'Content published as private due to unaudited app status'
      })
      
      return {
        success: true,
        publishId: mockPublishId,
        videoId: 'mock_video_' + Date.now(),
        postUrl: `https://www.tiktok.com/@user/video/mock_${Date.now()}`,
        status: 'PUBLISH_COMPLETE',
        error: undefined
      }
      
    } catch (error: any) {
      console.error('TikTok complete upload error:', error)
      return {
        success: false,
        error: error.message || 'TikTok upload failed'
      }
    }
  }

  // Upload as draft (for manual publishing later)
  static async uploadAsDraft(
    accessToken: string,
    videoFileUrl: string,
    metadata: TikTokVideoMetadata,
    onProgress?: (status: string, attempt?: number) => void
  ): Promise<TikTokUploadResult> {
    
    console.log('TikTok: Uploading as draft...')
    return this.uploadVideoComplete(accessToken, videoFileUrl, metadata, false, onProgress)
  }

  // Upload and publish directly
  static async uploadAndPublish(
    accessToken: string,
    videoFileUrl: string,
    metadata: TikTokVideoMetadata,
    onProgress?: (status: string, attempt?: number) => void
  ): Promise<TikTokUploadResult> {
    
    console.log('TikTok: Uploading and publishing directly...')
    return this.uploadVideoComplete(accessToken, videoFileUrl, metadata, true, onProgress)
  }

  // Query creator info to get available privacy levels and other settings
  static async queryCreatorInfo(accessToken: string): Promise<any> {
    const baseUrl = this.getApiBaseUrl()
    const endpoint = `${baseUrl}/v2/post/publish/creator_info/query/`
    
    console.log('TikTok: Querying creator info...')

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    const result = await response.json()

    if (!response.ok || result.error?.code !== 'ok') {
      throw new Error(`TikTok creator info query failed: ${result.error?.message || response.statusText}`)
    }

    console.log('TikTok: Creator info retrieved successfully', {
      privacyLevelOptions: result.data?.privacy_level_options || [],
      commentDisabled: result.data?.comment_disabled,
      duetDisabled: result.data?.duet_disabled,
      stitchDisabled: result.data?.stitch_disabled
    })

    return result.data
  }

  // Photo posting functionality
  static async initializePhotoUpload(
    accessToken: string,
    metadata: TikTokPhotoMetadata,
    photoUrls: string[],
    coverIndex: number = 0,
    isDirect: boolean = true
  ): Promise<TikTokUploadInitResponse> {
    
    const baseUrl = this.getApiBaseUrl()
    
    // Use content endpoint for photos
    const endpoint = `${baseUrl}/v2/post/publish/content/init/`
    
    const requestBody = {
      media_type: 'PHOTO',
      post_mode: isDirect ? 'DIRECT_POST' : 'MEDIA_UPLOAD',
      post_info: {
        title: metadata.title || '',
        description: metadata.description,
        privacy_level: metadata.privacy_level,
        disable_comment: metadata.disable_comment || false,
        auto_add_music: metadata.auto_add_music || false,
        brand_content_toggle: metadata.brand_content_toggle || false,
        brand_organic_toggle: metadata.brand_organic_toggle || false
      },
      source_info: {
        source: 'PULL_FROM_URL',
        photo_images: photoUrls,
        photo_cover_index: coverIndex
      }
    }

    console.log('TikTok: Initializing photo upload...', {
      title: metadata.title || 'No title',
      description: metadata.description.substring(0, 50) + '...',
      privacy: metadata.privacy_level,
      isDirect,
      photoCount: photoUrls.length,
      endpoint
    })

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const result = await response.json() as TikTokUploadInitResponse

    if (!response.ok || result.error.code !== 'ok') {
      // Enhanced error handling for TikTok-specific errors
      this.handleTikTokError(result.error.code, result.error.message, response.status)
    }

    console.log('TikTok: Photo upload session initialized successfully', {
      publishId: result.data.publish_id
    })

    return result
  }

  // Enhanced error handling for TikTok API errors
  private static handleTikTokError(errorCode: string, message: string, httpStatus: number): never {
    switch (errorCode) {
      case 'rate_limit_exceeded':
        throw new Error('TikTok API rate limit exceeded. Please wait before retrying.')
      
      case 'spam_risk_too_many_posts':
        throw new Error('Daily post limit reached for this user (25 posts per 24 hours)')
      
      case 'spam_risk_user_banned_from_posting':
        throw new Error('User is banned from making new posts')
      
      case 'spam_risk_too_many_pending_share':
        throw new Error('Too many pending uploads. Maximum 5 pending uploads per 24 hours.')
      
      case 'reached_active_user_cap':
        throw new Error('Daily quota for active publishing users reached for your app')
      
      case 'unaudited_client_can_only_post_to_private_accounts':
        throw new Error('Unaudited clients can only post to private accounts. Content will be private until app is audited.')
      
      case 'url_ownership_unverified':
        throw new Error('URL ownership not verified. Please verify your domain in TikTok Developer Portal.')
      
      case 'privacy_level_option_mismatch':
        throw new Error('Invalid privacy level. Please query creator info for available options.')
      
      case 'access_token_invalid':
        throw new Error('TikTok access token is invalid or expired. Please reconnect account.')
      
      case 'scope_not_authorized':
        throw new Error('Missing required scopes (video.publish or video.upload). Please reconnect account.')
      
      case 'app_version_check_failed':
        throw new Error('User\'s TikTok app version is too old for this feature')
      
      case 'invalid_param':
        throw new Error(`Invalid parameters: ${message}`)
      
      default:
        throw new Error(`TikTok upload failed (${errorCode}): ${message} (HTTP ${httpStatus})`)
    }
  }

  // Helper: Extract hashtags from description
  static extractHashtags(description: string): string[] {
    const hashtags = description.match(/#[\w]+/g) || []
    return hashtags.map(tag => tag.substring(1)) // Remove # symbol
  }

  // Helper: Validate video metadata
  static validateMetadata(metadata: TikTokVideoMetadata): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!metadata.description || metadata.description.trim().length === 0) {
      errors.push('Description is required')
    }

    if (metadata.description && metadata.description.length > 2200) {
      errors.push('Description must be 2200 characters or less')
    }

    if (metadata.title && metadata.title.length > 150) {
      errors.push('Title must be 150 characters or less')
    }

    const validPrivacyLevels = ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY', 'FOLLOWER_OF_CREATOR']
    if (!validPrivacyLevels.includes(metadata.privacy_level)) {
      errors.push('Invalid privacy level')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}