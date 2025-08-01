import { NextRequest, NextResponse } from 'next/server'
import { FileService } from '@/backend/services/fileService'

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

    const files = await FileService.getContentFiles(params.id)

    return NextResponse.json({
      success: true,
      data: files
    })

  } catch (error: any) {
    console.error('Get content files error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get files' },
      { status: 500 }
    )
  }
}