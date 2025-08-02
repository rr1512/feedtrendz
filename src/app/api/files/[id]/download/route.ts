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

    console.log('Downloading file with ID:', params.id)

    // Get file info from database
    const file = await FileService.getFileById(params.id)
    
    if (!file) {
      console.log('File not found in database:', params.id)
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    console.log('File found:', file)

    // Use the actual file_url path from database
    // file.file_url is something like "/uploads/workspaceId/contentId/filename.jpg"
    const filePath = path.join(process.cwd(), 'public', file.file_url)
    
    console.log('File path:', filePath)

    try {
      // Check if file exists
      const fs = require('fs')
      if (!fs.existsSync(filePath)) {
        console.error('File does not exist at path:', filePath)
        return NextResponse.json(
          { success: false, error: 'File not found on disk' },
          { status: 404 }
        )
      }

      // Read file from disk
      const fileBuffer = await readFile(filePath)
      
      // Set appropriate headers for download
      const headers = new Headers()
      headers.set('Content-Type', file.file_type || 'application/octet-stream')
      headers.set('Content-Disposition', `attachment; filename="${file.file_name}"`)
      headers.set('Content-Length', fileBuffer.length.toString())
      
      console.log('File download successful:', file.file_name)
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: headers
      })
    } catch (fileError) {
      console.error('File read error:', fileError)
      console.error('Attempted file path:', filePath)
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