import { NextRequest, NextResponse } from 'next/server'
import { ContentService } from '@/backend/services/contentService'
import { contentBriefSchema, updateContentStatusSchema } from '@/backend/utils/validation'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const content = await ContentService.getContentBrief(params.id, userId)

    return NextResponse.json({
      success: true,
      data: content
    })
  } catch (error: any) {
    console.error('Get content error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get content' },
      { status: 400 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = contentBriefSchema.partial().parse(body)

    const content = await ContentService.updateContentBrief(params.id, userId, validatedData)

    return NextResponse.json({
      success: true,
      data: content
    })
  } catch (error: any) {
    console.error('Update content error:', error)
    
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
      { success: false, error: error.message || 'Failed to update content' },
      { status: 400 }
    )
  }
}