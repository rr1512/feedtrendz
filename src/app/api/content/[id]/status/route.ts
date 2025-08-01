import { NextRequest, NextResponse } from 'next/server'
import { ContentService } from '@/backend/services/contentService'

export async function PATCH(
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
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    const validStatuses = [
      'draft', 
      'waiting_for_editor', 
      'edited', 
      'review', 
      'revision', 
      'approved', 
      'scheduled', 
      'published'
    ]

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    const result = await ContentService.updateContentStatus(
      params.id, 
      userId, 
      { status }
    )

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Update content status error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update content status' 
      },
      { status: 500 }
    )
  }
}