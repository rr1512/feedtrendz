import { NextRequest, NextResponse } from 'next/server'
import { FileService } from '@/backend/services/fileService'

interface RouteParams {
  params: {
    id: string
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    await FileService.deleteFile(params.id)

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error: any) {
    console.error('File delete error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete file' },
      { status: 500 }
    )
  }
}