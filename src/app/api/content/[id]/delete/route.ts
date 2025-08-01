import { NextRequest, NextResponse } from 'next/server'
import { ContentService } from '@/backend/services/contentService'
import { verifyToken } from '@/backend/utils/jwt'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get JWT token from cookie
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify JWT token
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const contentId = params.id
    const userId = payload.userId

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: 'Content ID is required' },
        { status: 400 }
      )
    }

    // Delete content brief and associated files
    const result = await ContentService.deleteContentBrief(contentId, userId)

    return NextResponse.json({
      success: true,
      message: result.message
    })
  } catch (error: any) {
    console.error('Delete content error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete content' },
      { status: 400 }
    )
  }
}