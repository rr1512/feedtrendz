import { NextRequest, NextResponse } from 'next/server'
import { SocialPublishingService } from '@/backend/services/socialPublishingService'
import { SocialMediaService } from '@/backend/services/socialMediaService'
import { ContentService } from '@/backend/services/contentService'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const workspaceId = request.headers.get('x-workspace-id')
    
    if (!userId || !workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const requestData = await request.json()
    const { 
      contentId, 
      platforms, 
      title, 
      caption,
      scheduledAt 
    } = requestData

    console.log('Social publish request data:', {
      contentId,
      platforms,
      title,
      caption: caption ? `"${caption}"` : 'null/undefined',
      captionLength: caption?.length || 0,
      scheduledAt
    })

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: 'Content ID is required' },
        { status: 400 }
      )
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one platform must be selected' },
        { status: 400 }
      )
    }

    // Caption will be validated after getting content data

    // Get content brief data
    const content = await ContentService.getContentBrief(contentId, userId)
    
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }

    // Get content files (media)
    const contentFiles = content.content_files?.filter((file: any) => !file.is_editing_material) || []

    // Prepare publish data
    const finalCaption = caption || content.caption || ''
    
    const publishData = {
      title: title || content.title,
      caption: finalCaption.trim(),
      mediaFiles: contentFiles.map((file: any) => ({
        id: file.id,
        file_name: file.file_name,
        file_url: file.file_url || '',
        file_type: file.file_type,
        file_size: file.file_size
      })),
      scheduledAt
    }

    console.log('Final publish data:', {
      title: publishData.title,
      caption: publishData.caption ? `"${publishData.caption}"` : 'empty',
      captionLength: publishData.caption?.length || 0,
      mediaFilesCount: publishData.mediaFiles.length,
      platforms
    })

    // Validate final caption
    if (!publishData.caption || publishData.caption.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Caption is required. Please provide caption in the form or ensure content has a caption.' },
        { status: 400 }
      )
    }

    // If scheduled, save for later processing
    if (scheduledAt) {
      // TODO: Implement scheduling logic
      for (const platform of platforms) {
        await SocialMediaService.schedulePost(contentId, platform, scheduledAt)
      }

      return NextResponse.json({
        success: true,
        message: `Post scheduled for ${platforms.length} platform(s)`,
        data: { 
          scheduled: true,
          platforms,
          scheduledAt 
        }
      })
    }

    // Publish immediately to all platforms
    const results = await SocialPublishingService.publishToMultiplePlatforms(
      workspaceId,
      platforms,
      publishData
    )

    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    // Update content status if all platforms successful
    if (failed.length === 0) {
      await ContentService.updateContentStatus(contentId, userId, {
        status: 'published'
      })
    }

    return NextResponse.json({
      success: failed.length === 0,
      message: `Published to ${successful.length}/${platforms.length} platform(s)`,
      data: {
        results,
        successful: successful.length,
        failed: failed.length
      }
    })

  } catch (error: any) {
    console.error('Social publish error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to publish content' },
      { status: 500 }
    )
  }
}