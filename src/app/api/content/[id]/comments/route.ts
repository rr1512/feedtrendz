import { NextRequest, NextResponse } from 'next/server'
import { ContentService } from '@/backend/services/contentService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = request.headers.get('x-workspace-id')
    const userId = request.headers.get('x-user-id')
    
    if (!workspaceId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required headers' },
        { status: 400 }
      )
    }

    const comments = await ContentService.getContentComments(params.id, workspaceId, userId)

    return NextResponse.json({
      success: true,
      data: comments
    })
  } catch (error: any) {
    console.error('Get content comments error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get content comments' 
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = request.headers.get('x-workspace-id')
    const userId = request.headers.get('x-user-id')
    
    if (!workspaceId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required headers' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { comment } = body

    if (!comment?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Comment is required' },
        { status: 400 }
      )
    }

    const result = await ContentService.addContentComment(
      params.id, 
      workspaceId, 
      userId, 
      comment.trim()
    )

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Add content comment error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to add comment' 
      },
      { status: 500 }
    )
  }
}