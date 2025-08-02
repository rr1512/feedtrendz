'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/frontend/contexts/toast-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/frontend/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/frontend/components/ui/sheet'
import { Badge } from '@/frontend/components/ui/badge'
import { Button } from '@/frontend/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/frontend/components/ui/avatar'

import { Label } from '@/frontend/components/ui/label'
import { Separator } from '@/frontend/components/ui/separator'
import { 
  User, 
  Calendar, 
  FileText, 
  Download, 
  Upload, 
  FileAudio,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Send,
  Play,
  Image,
  Music,
  Video,
  X,
  Share2
} from 'lucide-react'
import { SocialMediaPublisher } from './social-media-publisher'

interface ContentBrief {
  id: string
  title: string
  script: string
  caption: string
  note?: string
  label?: string
  status: 'draft' | 'waiting_for_editor' | 'edited' | 'review' | 'revision' | 'approved' | 'scheduled' | 'published'
  created_at: string
  updated_at: string
  created_by_user: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  assigned_editor_user?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  assigned_manager_user?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  content_files?: Array<{
    id: string
    file_name: string
    file_type: string
    file_size: number
    is_editing_material: boolean
    file_url?: string
  }>
}

interface ContentBriefDetailModalProps {
  content: ContentBrief
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
  userRole?: string
  currentWorkspace?: {
    id: string
    name: string
    userRole: string
  }
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  waiting_for_editor: 'bg-yellow-100 text-yellow-800',
  edited: 'bg-blue-100 text-blue-800',
  review: 'bg-purple-100 text-purple-800',
  revision: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800',
  scheduled: 'bg-indigo-100 text-indigo-800',
  published: 'bg-emerald-100 text-emerald-800'
}

const statusLabels = {
  draft: 'Draft',
  waiting_for_editor: 'Waiting for Editor',
  edited: 'Edited',
  review: 'Review',
  revision: 'Revision',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published'
}

export function ContentBriefDetailModal({ content, isOpen, onClose, onUpdate, userRole, currentWorkspace }: ContentBriefDetailModalProps) {
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewFile, setPreviewFile] = useState<{id: string, url: string, type: string, name: string} | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedEditedFiles, setSelectedEditedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') {
      return 'U'
    }
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getFileType = (fileName: string, fileType: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    // Video files
    if (fileType.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '')) {
      return 'video'
    }
    
    // Audio files
    if (fileType.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension || '')) {
      return 'audio'
    }
    
    // Image files
    if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      return 'image'
    }
    
    return 'document'
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'video':
        return <Video className="w-5 h-5 text-red-500" />
      case 'audio':
        return <Music className="w-5 h-5 text-green-500" />
      case 'image':
        return <Image className="w-5 h-5 text-blue-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  const handlePreview = async (file: any) => {
    try {
      // Use the actual file URL if available, otherwise construct it
      const fileUrl = file.file_url || `/api/files/${file.id}/download`
      const fileType = getFileType(file.file_name, file.file_type)
      
      setPreviewFile({
        id: file.id,
        url: fileUrl,
        type: fileType,
        name: file.file_name
      })
    } catch (error) {
      console.error('Error previewing file:', error)
    }
  }

  const handleDownload = async (file: any) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to download file')
      }

      // Create blob from response
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.file_name || 'download'
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('File downloaded successfully')
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }

  const editingMaterials = content.content_files?.filter(file => file.is_editing_material) || []
  const editedFiles = content.content_files?.filter(file => !file.is_editing_material) || []

  // Check if user can approve or request revision
  const canApproveOrRevise = () => {
    if (!currentWorkspace) return false
    
    // Only workspace owner and social media manager can approve/revise
    return ['owner', 'social_media_manager'].includes(currentWorkspace.userRole)
  }

  const handleStatusUpdate = async (newStatus: string) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/content/${content.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      const responseData = await response.json()

      if (response.ok && responseData.success) {
        console.log('Status updated successfully to:', newStatus)
        toast.success('Status updated successfully', `Content status changed to ${newStatus}`)
        onUpdate?.()
      } else {
        console.error('Status update failed:', responseData)
        toast.error('Failed to update status', responseData.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status', 'Please try again')
    }
    setIsSubmitting(false)
  }



  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/content/${content.id}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (data.success) {
        setShowDeleteConfirm(false)
        onClose()
        toast.success('Content deleted successfully', 'Content brief and all associated files have been removed')
        onUpdate?.() // Refresh the dashboard
      } else {
        toast.error('Failed to delete content', data.error || 'An error occurred while deleting')
      }
    } catch (error) {
      console.error('Failed to delete content:', error)
      toast.error('Failed to delete content', 'An unexpected error occurred')
    }
    setIsDeleting(false)
  }

  // Check if user can delete (creator, owner, or manager)
  const canDelete = () => {
    if (!currentWorkspace) return false
    
    // Allow deletion for workspace owner or social media manager
    const isOwnerOrManager = ['owner', 'social_media_manager'].includes(currentWorkspace.userRole)
    
    // For now, we'll allow any member to delete (can be restricted later)
    return isOwnerOrManager || true // TODO: Add proper user ID check when available
  }

  // Handle file selection for edited files
  const handleEditedFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedEditedFiles(prev => [...prev, ...files])
  }

  // Remove selected file
  const removeSelectedFile = (index: number) => {
    setSelectedEditedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Upload edited files
  const uploadEditedFiles = async () => {
    if (selectedEditedFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      
      selectedEditedFiles.forEach(file => {
        formData.append('files', file)
      })
      
      formData.append('contentId', content.id)
      formData.append('isEditingMaterial', 'false') // These are edited files, not editing materials

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        // Save file info to database
        const dbResponse = await fetch('/api/content/files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contentId: content.id,
            files: result.data
          })
        })

        if (dbResponse.ok) {
          // Auto change status to 'edited' after successful upload
          await handleStatusUpdate('edited')
          
          setSelectedEditedFiles([])
          setUploadProgress(100)
          onUpdate?.() // Refresh content data
          
          // Show success message
          toast.success('Files uploaded successfully!', 'Status automatically changed to edited')
        } else {
          throw new Error('Failed to save file info to database')
        }
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed', 'Please try again')
    }

    setIsUploading(false)
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files)
    setSelectedEditedFiles(prev => [...prev, ...files])
  }



  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-xl lg:max-w-2xl xl:max-w-4xl h-full overflow-y-auto bg-gradient-to-br from-white via-white to-blue-50/20 border-l border-gray-200 shadow-2xl"
        >
        <SheetHeader className="border-b border-gray-100 pb-4 mb-6 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {content.title}
            </SheetTitle>
            <div className="flex items-center gap-3">
              <Badge className={`${statusColors[content.status]} shadow-lg border-0 font-bold px-3 py-1.5`}>
              {statusLabels[content.status]}
            </Badge>
              {canDelete() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Content Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Script - Hidden for Social Media Manager */}
              {userRole !== 'social_media_manager' && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Script</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {content.script}
                  </p>
                </div>
              </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-700">Caption</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {content.caption}
                  </p>
                </div>
              </div>

              {/* Note - Hidden for Social Media Manager */}
              {content.note && userRole !== 'social_media_manager' && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Note</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {content.note}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Team Members */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">Team</Label>
                <div className="space-y-3">
                  {/* Creator */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={content.created_by_user.avatar_url} />
                      <AvatarFallback>
                        {getInitials(content.created_by_user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{content.created_by_user.full_name}</p>
                      <p className="text-xs text-gray-500">Script Writer</p>
                    </div>
                  </div>

                  {/* Editor */}
                  {content.assigned_editor_user && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={content.assigned_editor_user.avatar_url} />
                        <AvatarFallback>
                          {getInitials(content.assigned_editor_user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{content.assigned_editor_user.full_name}</p>
                        <p className="text-xs text-gray-500">Video Editor</p>
                      </div>
                    </div>
                  )}

                  {/* Manager */}
                  {content.assigned_manager_user && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={content.assigned_manager_user.avatar_url} />
                        <AvatarFallback>
                          {getInitials(content.assigned_manager_user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{content.assigned_manager_user.full_name}</p>
                        <p className="text-xs text-gray-500">Social Media Manager</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Timeline</Label>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {formatDate(content.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Updated: {formatDate(content.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Files Section */}
          {((editingMaterials.length > 0 && userRole !== 'video_editor' && userRole !== 'social_media_manager') || editedFiles.length > 0) && (
            <div className="space-y-4">
              <Label className="text-lg font-medium">Files</Label>
              
              {/* Show editing materials in Files section only if NOT video editor and NOT social media manager */}
              {editingMaterials.length > 0 && userRole !== 'video_editor' && userRole !== 'social_media_manager' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Editing Materials</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {editingMaterials.map((file) => {
                      const fileType = getFileType(file.file_name, file.file_type)
                      const isPreviewable = ['video', 'audio', 'image'].includes(fileType)
                      
                      return (
                        <div 
                          key={file.id} 
                          className={`flex items-center gap-3 p-3 border rounded-md ${isPreviewable ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
                          onClick={isPreviewable ? () => handlePreview(file) : undefined}
                        >
                          {getFileIcon(fileType)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.file_name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.file_size)}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              title="Download"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownload(file)
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {editedFiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Edited Files</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {editedFiles.map((file) => {
                      const fileType = getFileType(file.file_name, file.file_type)
                      const isPreviewable = ['video', 'audio', 'image'].includes(fileType)
                      
                      return (
                        <div 
                          key={file.id} 
                          className={`flex items-center gap-3 p-3 border rounded-md ${isPreviewable ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
                          onClick={isPreviewable ? () => handlePreview(file) : undefined}
                        >
                          {getFileIcon(fileType)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.file_name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.file_size)}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(file)
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Editing Materials Section - Only for Video Editors */}
          {userRole === 'video_editor' && editingMaterials.length > 0 && (
            <>
              <div className="space-y-4">
                <Label className="text-lg font-medium">Editing Materials</Label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Edit className="w-5 h-5 text-blue-600" />
                    <h4 className="text-sm font-medium text-blue-800">Materials for Editing</h4>
                  </div>
                  <p className="text-sm text-blue-700 mb-4">
                    Download these materials to start editing your video content.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {editingMaterials.map((file) => {
                      const fileType = getFileType(file.file_name, file.file_type)
                      const isPreviewable = ['video', 'audio', 'image'].includes(fileType)
                      
                      return (
                        <div 
                          key={file.id} 
                          className={`flex items-center gap-3 p-3 bg-white border border-blue-200 rounded-md ${isPreviewable ? 'cursor-pointer hover:bg-blue-50 transition-colors' : ''}`}
                          onClick={isPreviewable ? () => handlePreview(file) : undefined}
                        >
                          {getFileIcon(fileType)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-blue-900">{file.file_name}</p>
                            <p className="text-xs text-blue-600">{formatFileSize(file.file_size)}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              title="Download"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownload(file)
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              
              <Separator />
            </>
          )}

          {/* Upload Edited Files Section - Only for Video Editors */}
          {userRole === 'video_editor' && (content.status === 'waiting_for_editor' || content.status === 'edited') && (
            <>
              <div className="space-y-4">
                <Label className="text-lg font-medium">Upload Edited Files</Label>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Upload className="w-5 h-5 text-green-600" />
                    <h4 className="text-sm font-medium text-green-800">Submit Your Edited Content</h4>
                  </div>
                  <p className="text-sm text-green-700 mb-4">
                    Upload your final edited video and any additional files. Supported formats: MP4, MOV, AVI, ZIP
                  </p>
                  
                  {/* Show existing edited files if any */}
                  {editedFiles.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-green-800 mb-2">Uploaded Files:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {editedFiles.map((file) => {
                          const fileType = getFileType(file.file_name, file.file_type)
                          const isPreviewable = ['video', 'audio', 'image'].includes(fileType)
                          
                          return (
                            <div 
                              key={file.id} 
                              className={`flex items-center gap-3 p-3 bg-white border border-green-200 rounded-md ${isPreviewable ? 'cursor-pointer hover:bg-green-50 transition-colors' : ''}`}
                              onClick={isPreviewable ? () => handlePreview(file) : undefined}
                            >
                              {getFileIcon(fileType)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-green-900">{file.file_name}</p>
                                <p className="text-xs text-green-600">{formatFileSize(file.file_size)}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  title="Download"
                                  className="border-green-300 text-green-700 hover:bg-green-50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownload(file)
                                  }}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Selected Files Preview */}
                  {selectedEditedFiles.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-green-800 mb-2">Selected Files ({selectedEditedFiles.length}):</h5>
                      <div className="space-y-2">
                        {selectedEditedFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-white border border-green-200 rounded-md">
                            <FileText className="w-4 h-4 text-green-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-green-900">{file.name}</p>
                              <p className="text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeSelectedFile(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      {/* Upload Button */}
                      <div className="mt-3">
                        <Button
                          onClick={uploadEditedFiles}
                          disabled={isUploading}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isUploading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Uploading... {uploadProgress}%</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Files
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Upload Area */}
                  <div 
                    className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center bg-white hover:bg-green-50/50 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-8 h-8 text-green-500 mx-auto mb-3" />
                    <p className="text-sm text-green-700 mb-2">
                      Drag and drop your edited files here, or click to browse
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="video/*,audio/*,image/*,.zip,.rar,.pdf"
                      onChange={handleEditedFileSelect}
                      className="hidden"
                      id="edited-files-input"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                      onClick={() => document.getElementById('edited-files-input')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Files
                    </Button>
                  </div>
                  
                  {/* Status Information */}
                  <div className="mt-4 pt-3 border-t border-green-200">
                    {content.status === 'waiting_for_editor' ? (
                      <div className="text-center">
                        <p className="text-sm text-green-700 mb-2">
                          📤 Upload your edited files to automatically change status to "Edited"
                        </p>
                        {selectedEditedFiles.length > 0 && (
                          <p className="text-xs text-green-600">
                            {selectedEditedFiles.length} file(s) ready to upload
                          </p>
                        )}
                      </div>
                    ) : content.status === 'edited' ? (
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <p className="text-sm font-medium text-green-700">Work Completed</p>
                        </div>
                        <p className="text-xs text-green-600 mb-2">
                          You can still upload additional files or replace existing ones
                        </p>
                        {selectedEditedFiles.length > 0 && (
                          <p className="text-xs text-green-600">
                            {selectedEditedFiles.length} file(s) ready to upload
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              
              <Separator />
            </>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <Label className="text-lg font-medium">Actions</Label>
            
            {/* Status Actions */}
            <div className="flex gap-2 flex-wrap">
              
              {/* Approve and Revision actions - Only for Owner and Social Media Manager */}
              {content.status === 'edited' && canApproveOrRevise() && (
                <>
                  <Button 
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    onClick={() => handleStatusUpdate('revision')}
                    disabled={isSubmitting}
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Request Revision
                  </Button>
                </>
              )}

              {/* Information for users who cannot approve/revise */}
              {content.status === 'edited' && !canApproveOrRevise() && (
                <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Content Ready for Review</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Waiting for workspace owner or social media manager to approve or request revision
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Social Media Publishing */}
            {content.status === 'approved' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <Label className="text-lg font-medium flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Publish to Social Media
                  </Label>
                  
                  <SocialMediaPublisher 
                    content={content}
                    onPublishSuccess={() => {
                      toast.success('Content published successfully!')
                      onUpdate?.()
                    }}
                    onPublishError={(error: string) => {
                      toast.error(error)
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>

    {/* File Preview Modal */}
    <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 bg-black/95 border-0 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPreviewFile(null)}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white border-0 rounded-full w-10 h-10"
        >
          <X className="h-5 w-5" />
        </Button>
        
        {/* Content Container */}
        <div className="flex items-center justify-center w-full h-full min-h-[400px] p-4">
          {previewFile && (
            <>
              {previewFile.type === 'image' && (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              )}
              
              {previewFile.type === 'video' && (
                <video
                  src={previewFile.url}
                  controls
                  className="max-w-full max-h-full rounded-lg shadow-lg"
                  autoPlay
                >
                  Your browser does not support the video tag.
                </video>
              )}
              
              {previewFile.type === 'audio' && (
                <div className="w-full max-w-lg bg-white/10 backdrop-blur-sm rounded-xl p-8">
                  <div className="text-center text-white mb-6">
                    <FileAudio className="h-16 w-16 mx-auto mb-4 text-white/70" />
                    <p className="text-lg font-medium">{previewFile.name}</p>
                  </div>
                  <audio
                    src={previewFile.url}
                    controls
                    className="w-full"
                    autoPlay
                  >
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              )}
              
              {previewFile.type === 'document' && (
                <div className="text-center text-white bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-white/70" />
                  <p className="text-lg font-medium mb-2">{previewFile.name}</p>
                  <p className="text-white/70 mb-6">Document preview not available</p>
              <Button 
                    variant="outline" 
                    className="border-white/30 text-white hover:bg-white/10"
                    onClick={() => window.open(previewFile.url, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download to View
              </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-red-900">
            Delete Content Brief
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Are you sure you want to delete this content brief?</p>
              <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>"{content.title}"</strong> and all associated files will be permanently deleted.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </div>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Forever
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}