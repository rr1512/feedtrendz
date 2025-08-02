import { Readable } from 'stream'

export interface YouTubeVideoMetadata {
  title: string
  description: string
  categoryId?: string
  privacyStatus: 'public' | 'private' | 'unlisted'
  tags?: string[]
}

export interface YouTubeUploadResult {
  success: boolean
  videoId?: string
  error?: string
  uploadUrl?: string
}

export class YouTubeUpload {
  
  // Step 1: Initialize resumable upload session
  static async initializeUpload(
    accessToken: string,
    metadata: YouTubeVideoMetadata,
    fileSize: number
  ): Promise<{ uploadUrl: string }> {
    
    const url = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status'
    
    const requestBody = {
      snippet: {
        title: metadata.title,
        description: metadata.description,
        categoryId: metadata.categoryId || '22', // People & Blogs
        tags: metadata.tags || []
      },
      status: {
        privacyStatus: metadata.privacyStatus
      }
    }

    console.log('YouTube: Initializing resumable upload...', {
      title: metadata.title,
      fileSize: Math.round(fileSize / 1024 / 1024) + 'MB',
      privacyStatus: metadata.privacyStatus
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/*',
        'X-Upload-Content-Length': fileSize.toString()
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`YouTube upload initialization failed: ${response.status} - ${errorText}`)
    }

    const uploadUrl = response.headers.get('location')
    if (!uploadUrl) {
      throw new Error('YouTube did not return upload URL')
    }

    console.log('YouTube: Upload session initialized successfully')
    return { uploadUrl }
  }

  // Step 2: Upload video file in chunks
  static async uploadVideo(
    uploadUrl: string,
    fileBuffer: Buffer,
    onProgress?: (percentage: number) => void
  ): Promise<YouTubeUploadResult> {
    
    const fileSize = fileBuffer.length
    const chunkSize = 256 * 1024 // 256KB chunks
    let uploadedBytes = 0

    console.log('YouTube: Starting video upload...', {
      fileSize: Math.round(fileSize / 1024 / 1024) + 'MB',
      chunkSize: Math.round(chunkSize / 1024) + 'KB'
    })

    // Upload file in chunks
    while (uploadedBytes < fileSize) {
      const start = uploadedBytes
      const end = Math.min(uploadedBytes + chunkSize, fileSize)
      const chunk = fileBuffer.slice(start, end)
      
      const contentRange = `bytes ${start}-${end - 1}/${fileSize}`
      let percentage = 0
      
      try {
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Length': chunk.length.toString(),
            'Content-Range': contentRange
          },
          body: chunk
        })

        uploadedBytes = end
        percentage = Math.round((uploadedBytes / fileSize) * 100)
        
        if (onProgress) {
          onProgress(percentage)
        }

        console.log(`YouTube: Upload progress: ${percentage}% (${Math.round(uploadedBytes / 1024 / 1024)}MB/${Math.round(fileSize / 1024 / 1024)}MB)`)

        // Check if upload is complete
        if (response.status === 200 || response.status === 201) {
          const result = await response.json()
          console.log('YouTube: Upload completed successfully!', {
            videoId: result.id,
            status: result.status?.uploadStatus
          })
          
          return {
            success: true,
            videoId: result.id
          }
        }
        
        // Continue uploading if status is 308 (Resume Incomplete)
        if (response.status !== 308) {
          const errorText = await response.text()
          throw new Error(`Upload chunk failed: ${response.status} - ${errorText}`)
        }
        
      } catch (error: any) {
        console.error('YouTube upload chunk error:', error)
        throw new Error(`Upload failed at ${percentage}%: ${error.message}`)
      }
    }

    throw new Error('Upload completed but no success response received')
  }

  // Helper: Fetch video file from local storage
  static async fetchVideoFile(fileUrl: string): Promise<Buffer> {
    const fullUrl = `${process.env.NEXTAUTH_URL}/api/files/public${fileUrl}`
    
    console.log('YouTube: Fetching video file...', { fileUrl: fullUrl })
    
    try {
      const response = await fetch(fullUrl)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch video file: ${response.status} ${response.statusText}`)
      }
      
      const buffer = Buffer.from(await response.arrayBuffer())
      console.log('YouTube: Video file fetched successfully', {
        size: Math.round(buffer.length / 1024 / 1024) + 'MB'
      })
      
      return buffer
    } catch (error: any) {
      console.error('YouTube: Failed to fetch video file:', error)
      throw new Error(`Cannot access video file: ${error.message}`)
    }
  }

  // Complete upload process: Initialize + Upload
  static async uploadVideoComplete(
    accessToken: string,
    videoFileUrl: string,
    metadata: YouTubeVideoMetadata,
    onProgress?: (percentage: number) => void
  ): Promise<YouTubeUploadResult> {
    
    try {
      // Step 1: Fetch video file
      const fileBuffer = await this.fetchVideoFile(videoFileUrl)
      
      // Step 2: Initialize resumable upload
      const { uploadUrl } = await this.initializeUpload(accessToken, metadata, fileBuffer.length)
      
      // Step 3: Upload video file
      const result = await this.uploadVideo(uploadUrl, fileBuffer, onProgress)
      
      return result
      
    } catch (error: any) {
      console.error('YouTube complete upload error:', error)
      return {
        success: false,
        error: error.message || 'YouTube upload failed'
      }
    }
  }
}