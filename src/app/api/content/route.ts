import { NextRequest, NextResponse } from 'next/server'
import { ContentService } from '@/backend/services/contentService'
import { contentBriefSchema } from '@/backend/utils/validation'

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.headers.get('x-workspace-id')
    const userId = request.headers.get('x-user-id')
    
    if (!workspaceId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required headers' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      status: searchParams.get('status') || undefined,
      assignedToMe: searchParams.get('assignedToMe') === 'true',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    }

    const result = await ContentService.getContentBriefs(workspaceId, userId, filters)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Get content error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get content' },
      { status: 400 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const validatedData = contentBriefSchema.parse(body)

    const content = await ContentService.createContentBrief(workspaceId, userId, validatedData)

    return NextResponse.json({
      success: true,
      data: content
    })
  } catch (error: any) {
    console.error('Create content error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.errors 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create content' },
      { status: 400 }
    )
  }
}