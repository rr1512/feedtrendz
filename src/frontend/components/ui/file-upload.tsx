'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from './button'
import { Card, CardContent } from './card'
import { Badge } from './badge'
import { Upload, X, File, Image, Video, FileText, AlertCircle, CheckCircle, FileAudio } from 'lucide-react'
import { formatFileSize, isImageFile, isVideoFile, isAudioFile } from '@/frontend/lib/utils'
import { cn } from '@/frontend/lib/utils'

interface UploadedFile {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
}

interface FileUploadProps {
  contentId?: string
  isEditingMaterial?: boolean
  maxFiles?: number
  maxSize?: number
  accept?: string[]
  onUploadSuccess?: (files: UploadedFile[]) => void
  onUploadError?: (error: string) => void
  onFilesChange?: (files: FileWithPreview[]) => void
  className?: string
  disabled?: boolean
}

interface FileWithPreview extends File {
  preview?: string
  id?: string
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error'
  uploadError?: string
}

export function FileUpload({
  contentId,
  isEditingMaterial = true,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = ['image/*', 'video/*', 'audio/*', 'application/pdf'],
  onUploadSuccess,
  onUploadError,
  onFilesChange,
  className,
  disabled = false
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // Notify parent when files change
  useEffect(() => {
    onFilesChange?.(files)
  }, [files, onFilesChange])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      const fileWithPreview = Object.assign(file, {
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        id: Math.random().toString(36).substring(2),
        uploadStatus: 'pending' as const
      })
      return fileWithPreview
    })

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles))
  }, [maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxSize,
    maxFiles,
    disabled: disabled || isUploading
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== fileId)
      // Revoke preview URL for images
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return updatedFiles
    })
  }

  const uploadFiles = async () => {
    if (!contentId || files.length === 0) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      
      files.forEach(file => {
        formData.append('files', file)
      })
      
      formData.append('contentId', contentId)
      formData.append('isEditingMaterial', isEditingMaterial.toString())

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        // Update file status to success
        setFiles(prev => prev.map(f => ({ ...f, uploadStatus: 'success' as const })))
        
        // Save file info to database
        if (contentId) {
          try {
            const dbResponse = await fetch('/api/content/files', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                contentId,
                files: result.data
              })
            })

            if (!dbResponse.ok) {
              console.error('Failed to save file info to database')
            }
          } catch (error) {
            console.error('Error saving file info:', error)
          }
        }
        
        // Call success callback
        onUploadSuccess?.(result.data)

        // Clear files after successful upload
        setTimeout(() => {
          setFiles([])
        }, 1000)
      } else {
        // Update file status to error
        setFiles(prev => prev.map(f => ({ 
          ...f, 
          uploadStatus: 'error' as const,
          uploadError: result.error 
        })))
        
        onUploadError?.(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      
      // Update file status to error
      setFiles(prev => prev.map(f => ({ 
        ...f, 
        uploadStatus: 'error' as const,
        uploadError: 'Upload failed' 
      })))
      
      onUploadError?.('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const getFileIcon = (file: FileWithPreview) => {
    if (isImageFile(file.name)) {
      return <Image className="h-4 w-4" />
    } else if (isVideoFile(file.name)) {
      return <Video className="h-4 w-4" />
    } else if (isAudioFile(file.name)) {
      return <FileAudio className="h-4 w-4" />
    } else {
      return <FileText className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        {isDragActive ? (
          <p className="text-sm text-primary">Drop files here...</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Max {maxFiles} files, {formatFileSize(maxSize)} each
            </p>
            <p className="text-xs text-muted-foreground">
              Supported: {accept.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Selected Files ({files.length})</h4>
                {contentId && (
                  <Button 
                    onClick={uploadFiles}
                    disabled={isUploading || files.every(f => f.uploadStatus === 'success')}
                    size="sm"
                  >
                    {isUploading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {/* File Preview/Icon */}
                      <div className="flex-shrink-0">
                        {file.preview ? (
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-10 h-10 object-cover rounded"
                            onLoad={() => URL.revokeObjectURL(file.preview!)}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            {getFileIcon(file)}
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          {getStatusIcon(file.uploadStatus!)}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{file.type}</span>
                          {file.uploadStatus === 'success' && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">
                                Uploaded
                              </Badge>
                            </>
                          )}
                        </div>
                        {file.uploadError && (
                          <p className="text-xs text-red-600 mt-1">{file.uploadError}</p>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id!)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}