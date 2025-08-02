import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

interface RouteParams {
  params: {
    path: string[]
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Construct file path from URL params
    const filePath = params.path.join('/')
    const fullPath = path.join(process.cwd(), 'public', filePath)
    
    console.log('Public file access:', {
      requestPath: filePath,
      fullPath,
      exists: existsSync(fullPath)
    })

    // Check if file exists
    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await readFile(fullPath)
    
    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.png':
        contentType = 'image/png'
        break
      case '.gif':
        contentType = 'image/gif'
        break
      case '.webp':
        contentType = 'image/webp'
        break
      case '.mp4':
        contentType = 'video/mp4'
        break
      case '.mov':
        contentType = 'video/quicktime'
        break
      case '.avi':
        contentType = 'video/x-msvideo'
        break
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error: any) {
    console.error('Public file access error:', error)
    
    return NextResponse.json(
      { success: false, error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}