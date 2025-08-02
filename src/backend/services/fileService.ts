import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { supabaseAdmin } from '../config/database'

export class FileService {
  // Upload directory
  private static uploadDir = path.join(process.cwd(), 'public', 'uploads')

  // Ensure upload directory exists
  static async ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true })
    }
  }

  // Generate unique filename
  static generateFileName(originalName: string): string {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = path.extname(originalName)
    const nameWithoutExt = path.basename(originalName, extension)
    
    return `${timestamp}_${randomString}_${nameWithoutExt}${extension}`
  }

  // Upload single file
  static async uploadFile(
    file: File,
    contentId: string,
    isEditingMaterial: boolean = true
  ): Promise<{
    id: string
    fileName: string
    fileUrl: string
    fileSize: number
    fileType: string
  }> {
    try {
      await this.ensureUploadDir()

      // Generate unique filename
      const fileName = this.generateFileName(file.name)
      const filePath = path.join(this.uploadDir, fileName)
      
      // Convert File to Buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Write file to disk
      await writeFile(filePath, buffer)

      // Create file URL
      const fileUrl = `/uploads/${fileName}`

      // Save file info to database
      const { data: fileRecord, error } = await supabaseAdmin
        .from('content_files')
        .insert({
          content_id: contentId,
          file_url: fileUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          is_editing_material: isEditingMaterial
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to save file record: ${error.message}`)
      }

      return {
        id: fileRecord.id,
        fileName: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        fileType: file.type
      }
    } catch (error) {
      throw error
    }
  }

  // Upload multiple files
  static async uploadFiles(
    files: File[],
    contentId: string,
    isEditingMaterial: boolean = true
  ): Promise<Array<{
    id: string
    fileName: string
    fileUrl: string
    fileSize: number
    fileType: string
  }>> {
    const uploadPromises = files.map(file => 
      this.uploadFile(file, contentId, isEditingMaterial)
    )

    return Promise.all(uploadPromises)
  }

  // Get files for content
  static async getContentFiles(contentId: string) {
    try {
      const { data: files, error } = await supabaseAdmin
        .from('content_files')
        .select('*')
        .eq('content_id', contentId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to get content files: ${error.message}`)
      }

      return files
    } catch (error) {
      throw error
    }
  }

  // Delete file
  static async deleteFile(fileId: string) {
    try {
      // Get file info first
      const { data: file, error: getError } = await supabaseAdmin
        .from('content_files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (getError || !file) {
        throw new Error('File not found')
      }

      // Delete from database
      const { error: deleteError } = await supabaseAdmin
        .from('content_files')
        .delete()
        .eq('id', fileId)

      if (deleteError) {
        throw new Error(`Failed to delete file record: ${deleteError.message}`)
      }

      // Try to delete physical file (ignore errors if file doesn't exist)
      try {
        const fs = require('fs').promises
        const filePath = path.join(process.cwd(), 'public', file.file_url)
        await fs.unlink(filePath)
      } catch (physicalDeleteError) {
        console.warn('Could not delete physical file:', physicalDeleteError)
      }

      return { success: true }
    } catch (error) {
      throw error
    }
  }

  // Validate file
  static validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 
      'image/jpeg,image/png,image/gif,video/mp4,video/avi,video/mov,application/pdf').split(',')

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
      }
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed`
      }
    }

    return { isValid: true }
  }

  // Validate multiple files
  static validateFiles(files: File[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    files.forEach((file, index) => {
      const validation = this.validateFile(file)
      if (!validation.isValid) {
        errors.push(`File ${index + 1} (${file.name}): ${validation.error}`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Get file info by ID
  static async getFileById(fileId: string) {
    try {
      const { data: file, error } = await supabaseAdmin
        .from('content_files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (error) {
        throw new Error(`File not found: ${error.message}`)
      }

      return file
    } catch (error) {
      throw error
    }
  }

  // Get file path for download
  static getFilePath(fileName: string): string {
    return path.join(this.uploadDir, fileName)
  }
}