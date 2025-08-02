import { SocialMediaService, SocialAccount } from './socialMediaService'
import { InstagramBusinessAuth } from '../utils/instagramBusinessAuth'
import { TikTokUpload, TikTokVideoMetadata } from '../utils/tiktokUpload'

export interface PublishData {
  title?: string
  caption: string
  mediaFiles: Array<{
    id: string
    file_name: string
    file_url: string
    file_type: string
    file_size: number
  }>
  scheduledAt?: string
}

export interface PublishResult {
  success: boolean
  postId?: string
  error?: string
  platform: string
}

export class SocialPublishingService {
  // Publish to Facebook
  static async publishToFacebook(account: SocialAccount, data: PublishData): Promise<PublishResult> {
    try {
      // Validate caption
      if (!data.caption || data.caption.trim() === '') {
        throw new Error('Caption is required for Facebook posts')
      }

      // Use Page ID from account_id, fallback to 'me' if not available
      const pageId = account.account_id || 'me'
      
      const hasMedia = data.mediaFiles && data.mediaFiles.length > 0
      const mediaFile = hasMedia ? data.mediaFiles[0] : null
      
      // Construct proper public media URL that Facebook can access
      const mediaUrl = mediaFile ? `${process.env.NEXTAUTH_URL}/api/files/public${mediaFile.file_url}` : null
      
      let url: string
      let formData: URLSearchParams
      
      if (hasMedia && mediaFile?.file_type.startsWith('image/')) {
        // For image posts, use /photos endpoint for proper image upload
        url = `https://graph.facebook.com/v18.0/${pageId}/photos`
        formData = new URLSearchParams()
        formData.append('access_token', account.access_token)
        formData.append('url', mediaUrl!) // Facebook will fetch and upload the image
        formData.append('caption', data.caption.trim())
        formData.append('published', 'true') // Publish immediately
      } else if (hasMedia && mediaFile?.file_type.startsWith('video/')) {
        // For video posts, use /videos endpoint for proper video upload
        url = `https://graph.facebook.com/v18.0/${pageId}/videos`
        formData = new URLSearchParams()
        formData.append('access_token', account.access_token)
        formData.append('file_url', mediaUrl!) // Facebook will fetch and upload the video
        formData.append('description', data.caption.trim())
        formData.append('published', 'true') // Publish immediately
      } else {
        // For text-only posts
        url = `https://graph.facebook.com/v18.0/${pageId}/feed`
        formData = new URLSearchParams()
        formData.append('access_token', account.access_token)
        formData.append('message', data.caption.trim())
      }

      // Test if media URL is accessible (for debugging)
      if (mediaUrl) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          
          const testResponse = await fetch(mediaUrl, {
            method: 'HEAD',
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)
          console.log('Media URL accessibility test:', {
            mediaUrl,
            accessible: testResponse.ok,
            status: testResponse.status,
            contentType: testResponse.headers.get('content-type')
          })
        } catch (error) {
          console.error('Media URL not accessible:', error)
        }
      }

      console.log('Facebook API Request:', {
        endpoint: url,
        pageId,
        caption: data.caption,
        mediaUrl,
        hasMedia: !!mediaUrl,
        mediaType: mediaFile?.file_type || 'none',
        endpointType: hasMedia && mediaFile?.file_type.startsWith('image/') ? 'photos' : 
                     hasMedia && mediaFile?.file_type.startsWith('video/') ? 'videos' : 'feed',
        formDataKeys: Array.from(formData.keys())
      })

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      })

      const result = await response.json()

      console.log('Facebook API Response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        result: result,
        hasError: !!result.error,
        errorMessage: result.error?.message
      })

      if (!response.ok || result.error) {
        console.error('Facebook API Error Details:', {
          status: response.status,
          error: result.error,
          fullResponse: result
        })
        throw new Error(result.error?.message || `Facebook API error: ${response.status} ${response.statusText}`)
      }

      console.log('Facebook Post Success:', {
        postId: result.id,
        postUrl: result.post_id ? `https://www.facebook.com/${result.post_id}` : 'N/A'
      })

      return {
        success: true,
        postId: result.id,
        platform: 'facebook'
      }

    } catch (error: any) {
      console.error('Facebook publish error:', error)
      return {
        success: false,
        error: error.message || 'Failed to publish to Facebook',
        platform: 'facebook'
      }
    }
  }

  // Publish to Instagram using Instagram Business API (direct, no Facebook required)
  static async publishToInstagram(account: SocialAccount, data: PublishData): Promise<PublishResult> {
    try {
      if (!data.mediaFiles || data.mediaFiles.length === 0) {
        throw new Error('Instagram requires at least one media file')
      }

      const mediaFile = data.mediaFiles[0]
      const mediaUrl = `${process.env.NEXTAUTH_URL}/api/files/public${data.mediaFiles[0].file_url}`
      const isVideo = mediaFile.file_type.startsWith('video/')
      
      // Test if media URL is accessible (for debugging)
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const testResponse = await fetch(mediaUrl, {
          method: 'HEAD',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        console.log('Instagram Business API - Media URL accessibility test:', {
          mediaUrl,
          accessible: testResponse.ok,
          status: testResponse.status,
          contentType: testResponse.headers.get('content-type'),
          isVideo
        })
      } catch (error) {
        console.error('Instagram Business API - Media URL not accessible:', error)
      }
      
      // Use Instagram Business Account ID directly
      const instagramBusinessId = account.account_id
      if (!instagramBusinessId) {
        throw new Error('Instagram Business Account ID is required')
      }

      // Determine media type (Instagram API update: VIDEO -> REELS)
      const mediaType = isVideo ? 'REELS' : 'IMAGE'
      
      console.log('Publishing to Instagram Business API:', {
        businessAccountId: instagramBusinessId,
        mediaType,
        mediaUrl,
        caption: data.caption.substring(0, 100) + (data.caption.length > 100 ? '...' : '')
      })

      // Use the new Instagram Business Auth utility
      const publishResult = await InstagramBusinessAuth.publishContent(
        account.access_token,
        instagramBusinessId,
        mediaUrl,
        data.caption,
        mediaType
      )

      console.log('Instagram Business API publish success:', {
        postId: publishResult.id,
        permalink: publishResult.permalink,
        instagramBusinessId,
        accountName: account.account_name
      })

      return {
        success: true,
        postId: publishResult.id,
        platform: 'instagram'
      }

    } catch (error: any) {
      console.error('Instagram Business API publish error:', error)
      return {
        success: false,
        error: error.message || 'Failed to publish to Instagram',
        platform: 'instagram'
      }
    }
  }

  // Publish to YouTube
  static async publishToYouTube(account: SocialAccount, data: PublishData): Promise<PublishResult> {
    try {
      if (!data.mediaFiles || data.mediaFiles.length === 0) {
        throw new Error('YouTube requires a video file')
      }

      const videoFile = data.mediaFiles.find(file => file.file_type.startsWith('video/'))
      if (!videoFile) {
        throw new Error('YouTube requires a video file')
      }

      console.log('YouTube upload started:', {
        title: data.title || 'No title',
        description: data.caption.substring(0, 50) + '...',
        fileName: videoFile.file_name,
        fileSize: Math.round(videoFile.file_size / 1024 / 1024) + 'MB'
      })

      // Step 1: Get the video file from storage
      const videoUrl = `${process.env.NEXTAUTH_URL}/api/files/public${videoFile.file_url}`
      
      // Fetch the video file
      const videoResponse = await fetch(videoUrl)
      if (!videoResponse.ok) {
        throw new Error(`Failed to fetch video file: ${videoResponse.status}`)
      }
      
      const videoBlob = await videoResponse.blob()
      
      // Step 2: Prepare YouTube metadata
      const title = data.title || data.caption.substring(0, 100)
      const description = data.caption
      
      console.log('YouTube metadata prepared:', {
        title: title,
        description: description.substring(0, 50) + '...',
        titleLength: title.length,
        descriptionLength: description.length
      })

      // Step 3: Create multipart upload with proper boundary
      const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2, 8)
      
      const metadata = {
        snippet: {
          title: title,
          description: description,
          categoryId: '22', // People & Blogs
          tags: data.caption.split(' ').filter(word => word.startsWith('#')).map(tag => tag.substring(1))
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false
        }
      }

      // Create multipart body manually
      const metadataPart = `--${boundary}\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        JSON.stringify(metadata) + '\r\n'
      
      const videoPart = `--${boundary}\r\n` +
        `Content-Type: ${videoFile.file_type}\r\n\r\n`
      
      const endBoundary = `\r\n--${boundary}--\r\n`
      
      // Combine all parts
      const metadataBuffer = new TextEncoder().encode(metadataPart)
      const videoPartBuffer = new TextEncoder().encode(videoPart)
      const endBoundaryBuffer = new TextEncoder().encode(endBoundary)
      
      const combinedBuffer = new Uint8Array(metadataBuffer.length + videoPartBuffer.length + videoBlob.size + endBoundaryBuffer.length)
      let offset = 0
      
      combinedBuffer.set(metadataBuffer, offset)
      offset += metadataBuffer.length
      
      combinedBuffer.set(videoPartBuffer, offset)
      offset += videoPartBuffer.length
      
      // Add video blob
      const videoArrayBuffer = await videoBlob.arrayBuffer()
      combinedBuffer.set(new Uint8Array(videoArrayBuffer), offset)
      offset += videoArrayBuffer.byteLength
      
      combinedBuffer.set(endBoundaryBuffer, offset)

      // Step 4: Upload to YouTube API
      const url = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status'
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': combinedBuffer.length.toString()
        },
        body: combinedBuffer
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        console.error('YouTube API Error:', result)
        throw new Error(result.error?.message || `YouTube upload failed: ${response.status}`)
      }

      console.log('YouTube upload successful:', {
        videoId: result.id,
        title: result.snippet?.title,
        status: result.status?.privacyStatus,
        description: result.snippet?.description?.substring(0, 50) + '...',
        fullResponse: result
      })

      return {
        success: true,
        postId: result.id,
        platform: 'youtube'
      }

    } catch (error: any) {
      console.error('YouTube publish error:', error)
      return {
        success: false,
        error: error.message || 'Failed to publish to YouTube',
        platform: 'youtube'
      }
    }
  }

  // Publish to TikTok with proper TikTok API v2
  static async publishToTikTok(account: SocialAccount, data: PublishData): Promise<PublishResult> {
    try {
      if (!data.mediaFiles || data.mediaFiles.length === 0) {
        throw new Error('TikTok requires a video file')
      }

      const videoFile = data.mediaFiles.find(file => file.file_type.startsWith('video/'))
      if (!videoFile) {
        throw new Error('TikTok requires a video file')
      }

      console.log('TikTok upload started:', {
        title: data.title || 'No title',
        description: data.caption.substring(0, 50) + '...',
        fileName: videoFile.file_name,
        fileSize: Math.round(videoFile.file_size / 1024 / 1024) + 'MB'
      })

      // Prepare TikTok metadata
      const metadata: TikTokVideoMetadata = {
        title: data.title || undefined,
        description: data.caption,
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000, // 1 second thumbnail
        auto_add_music: false
      }

      // Validate metadata first
      const validation = TikTokUpload.validateMetadata(metadata)
      if (!validation.valid) {
        throw new Error(`TikTok metadata validation failed: ${validation.errors.join(', ')}`)
      }

      // Get full video URL for TikTok
      const videoFileUrl = `${process.env.NEXTAUTH_URL}/api/files/public${videoFile.file_url}`
      
      // Progress callback for status updates
      let lastLoggedStatus = ''
      const onProgress = (status: string, attempt?: number) => {
        if (status !== lastLoggedStatus) {
          console.log(`TikTok: ${status}${attempt ? ` (attempt ${attempt})` : ''}`)
          lastLoggedStatus = status
        }
      }

      // Upload and publish using proper TikTok API v2
      const result = await TikTokUpload.uploadAndPublish(
        account.access_token,
        videoFileUrl,
        metadata,
        onProgress
      )

      if (!result.success) {
        throw new Error(result.error || 'TikTok upload failed')
      }

      console.log('✅ TikTok video published successfully:', {
        publishId: result.publishId,
        videoId: result.videoId,
        postUrl: result.postUrl,
        status: result.status
      })

      return {
        success: true,
        postId: result.videoId || result.publishId!,
        platform: 'tiktok'
      }

    } catch (error: any) {
      console.error('TikTok publish error:', error)
      return {
        success: false,
        error: error.message || 'Failed to publish to TikTok',
        platform: 'tiktok'
      }
    }
  }

  // Main publish method that routes to appropriate platform
  static async publishToSocialMedia(
    workspaceId: string, 
    platform: string, 
    data: PublishData
  ): Promise<PublishResult> {
    try {
      // Get social accounts for workspace
      const accounts = await SocialMediaService.getWorkspaceSocialAccounts(workspaceId)
      const account = accounts.find(acc => acc.platform === platform && acc.is_active)

      if (!account) {
        return {
          success: false,
          error: `No active ${platform} account found`,
          platform
        }
      }

      // Check if token is expired
      if (account.expires_at && new Date(account.expires_at) < new Date()) {
        return {
          success: false,
          error: `${platform} access token has expired. Please reconnect your account.`,
          platform
        }
      }

      // Route to appropriate platform publisher
      switch (platform) {
        case 'facebook':
          return await this.publishToFacebook(account, data)
        case 'instagram':
          return await this.publishToInstagram(account, data)
        case 'youtube':
          return await this.publishToYouTube(account, data)
        case 'tiktok':
          return await this.publishToTikTok(account, data)
        default:
          return {
            success: false,
            error: `Unsupported platform: ${platform}`,
            platform
          }
      }

    } catch (error: any) {
      console.error(`Publish to ${platform} error:`, error)
      return {
        success: false,
        error: error.message || `Failed to publish to ${platform}`,
        platform
      }
    }
  }

  // Batch publish to multiple platforms
  static async publishToMultiplePlatforms(
    workspaceId: string, 
    platforms: string[], 
    data: PublishData
  ): Promise<PublishResult[]> {
    const results: PublishResult[] = []

    for (const platform of platforms) {
      const result = await this.publishToSocialMedia(workspaceId, platform, data)
      results.push(result)
    }

    return results
  }
}