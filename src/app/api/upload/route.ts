import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    // Get workspace ID from middleware headers
    const workspaceId = request.headers.get('x-workspace-id')
    
    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const contentId = formData.get('contentId') as string
    const isEditingMaterial = formData.get('isEditingMaterial') === 'true'

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: 'Content ID is required' },
        { status: 400 }
      )
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    // Create uploads directory structure: public/uploads/{workspaceId}/{contentId}/
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    const workspaceDir = join(uploadsDir, workspaceId)
    const contentDir = join(workspaceDir, contentId)
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    
    if (!existsSync(workspaceDir)) {
      await mkdir(workspaceDir, { recursive: true })
    }
    
    if (!existsSync(contentDir)) {
      await mkdir(contentDir, { recursive: true })
    }

    const uploadedFiles = []

    for (const file of files) {
      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const fileName = `${timestamp}_${randomString}.${fileExtension}`
      
      // Create file path
      const filePath = join(contentDir, fileName)
      
      // Convert file to buffer and write to disk
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      await writeFile(filePath, buffer)
      
      // Create file URL
      const fileUrl = `/uploads/${workspaceId}/${contentId}/${fileName}`
      
      uploadedFiles.push({
        id: `${timestamp}_${randomString}`,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
        isEditingMaterial
      })
    }

    return NextResponse.json({
      success: true,
      data: uploadedFiles
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}