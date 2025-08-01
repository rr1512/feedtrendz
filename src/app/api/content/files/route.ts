import { NextRequest, NextResponse } from 'next/server'
import { ContentService } from '@/backend/services/contentService'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const { contentId, files } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: 'Content ID is required' },
        { status: 400 }
      )
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Files are required' },
        { status: 400 }
      )
    }

    const insertedFiles = await ContentService.addFilesToContent(contentId, userId, files)

    return NextResponse.json({
      success: true,
      data: insertedFiles
    })
  } catch (error: any) {
    console.error('Add files error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add files' },
      { status: 400 }
    )
  }
} 