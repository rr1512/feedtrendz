import { NextRequest, NextResponse } from 'next/server'
import { FileService } from '@/backend/services/fileService'
import { readFile } from 'fs/promises'
import path from 'path'

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

    // Get file info from database
    const file = await FileService.getFileById(params.id)
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    // Extract filename from file_url (e.g., "/uploads/filename.jpg" -> "filename.jpg")
    const fileName = path.basename(file.file_url)
    const filePath = FileService.getFilePath(fileName)

    try {
      // Read file from disk
      const fileBuffer = await readFile(filePath)
      
      // Set appropriate headers for download
      const headers = new Headers()
      headers.set('Content-Type', file.file_type || 'application/octet-stream')
      headers.set('Content-Disposition', `attachment; filename="${file.file_name}"`)
      headers.set('Content-Length', fileBuffer.length.toString())
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: headers
      })
    } catch (fileError) {
      console.error('File read error:', fileError)
      return NextResponse.json(
        { success: false, error: 'File not accessible' },
        { status: 404 }
      )
    }

  } catch (error: any) {
    console.error('File download error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to download file' },
      { status: 500 }
    )
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