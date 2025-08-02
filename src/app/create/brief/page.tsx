'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/frontend/contexts/toast-context'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/frontend/components/layout/main-layout'
import { Button } from '@/frontend/components/ui/button'
import { Input } from '@/frontend/components/ui/input'
import { Textarea } from '@/frontend/components/ui/textarea'
import { Label } from '@/frontend/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import { FileUpload } from '@/frontend/components/ui/file-upload'

interface CreateBriefFormData {
  title: string
  script: string
  caption: string
  note: string
  label: string
  assignedEditor: string
  assignedManager: string
}

interface WorkspaceMember {
  user: {
    id: string
    email: string
    fullName: string
    avatarUrl?: string
  }
  role: string
}

export default function CreateBriefPage() {
  const router = useRouter()
  const toast = useToast()
  const [formData, setFormData] = useState<CreateBriefFormData>({
    title: '',
    script: '',
    caption: '',
    note: '',
    label: '',
    assignedEditor: '',
    assignedManager: ''
  })
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [createdContentId, setCreatedContentId] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/workspace/members')
        const result = await response.json()
        
        if (result.success) {
          setMembers(result.data)
        } else {
          // Fallback to mock data with proper UUIDs
          setMembers([
            {
              user: { 
                id: '550e8400-e29b-41d4-a716-446655440001', 
                email: 'editor@example.com', 
                fullName: 'Video Editor' 
              },
              role: 'video_editor'
            },
            {
              user: { 
                id: '550e8400-e29b-41d4-a716-446655440002', 
                email: 'manager@example.com', 
                fullName: 'Social Manager' 
              },
              role: 'social_media_manager'
            }
          ])
        }
      } catch (error) {
        console.error('Failed to fetch members:', error)
        // Fallback to mock data with proper UUIDs
        setMembers([
          {
            user: { 
              id: '550e8400-e29b-41d4-a716-446655440001', 
              email: 'editor@example.com', 
              fullName: 'Video Editor' 
            },
            role: 'video_editor'
          },
          {
            user: { 
              id: '550e8400-e29b-41d4-a716-446655440002', 
              email: 'manager@example.com', 
              fullName: 'Social Manager' 
            },
            role: 'social_media_manager'
          }
        ])
      }
    }

    fetchMembers()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFilesChange = (files: any[]) => {
    setSelectedFiles(files)
  }

  const uploadFiles = async (contentId: string) => {
    if (selectedFiles.length === 0) return []

    const formData = new FormData()
    
    selectedFiles.forEach(file => {
      formData.append('files', file)
    })
    
    formData.append('contentId', contentId)
    formData.append('isEditingMaterial', 'true')

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
          contentId,
          files: result.data
        })
      })

      if (!dbResponse.ok) {
        throw new Error('Failed to save file info to database')
      }

      return result.data
    } else {
      throw new Error(result.error || 'Upload failed')
    }
  }

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Create content brief with draft status if specified
      const briefData = {
        ...formData,
        status: asDraft ? 'draft' : 'waiting_for_editor'
      }
      
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(briefData),
      })

      const data = await response.json()

      if (data.success) {
        const contentId = data.data.id
        setCreatedContentId(contentId)
        
        // Upload files if any
        if (selectedFiles.length > 0) {
          try {
            await uploadFiles(contentId)
            toast.success(
              asDraft ? 'Draft saved successfully!' : 'Content brief created successfully!',
              asDraft ? 'Files uploaded and saved as draft' : 'Files uploaded and ready for editor'
            )
          } catch (uploadError: any) {
            toast.warning(
              asDraft ? 'Draft saved with upload issues' : 'Brief created with upload issues',
              'File upload failed: ' + uploadError.message
            )
          }
        } else {
          toast.success(
            asDraft ? 'Draft saved successfully!' : 'Content brief created successfully!',
            asDraft ? 'Saved as draft' : 'Ready for editor'
          )
        }

        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        toast.error('Failed to create brief', data.error || 'Unknown error occurred')
      }
    } catch (error) {
      toast.error('Failed to create brief', 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const editors = members.filter(m => m.role === 'video_editor')
  const managers = members.filter(m => m.role === 'social_media_manager')

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Content Brief</h1>
            <p className="text-muted-foreground">
              Create a new content brief for team collaboration
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide the essential details for your content brief
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Content Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter content title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  name="label"
                  placeholder="e.g., Product Launch, Tutorial, Campaign"
                  value={formData.label}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Details */}
          <Card>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
              <CardDescription>
                Write your script and caption for the content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="script">Script *</Label>
                <Textarea
                  id="script"
                  name="script"
                  placeholder="Write your content script here..."
                  value={formData.script}
                  onChange={handleInputChange}
                  className="min-h-[120px]"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Caption *</Label>
                <Textarea
                  id="caption"
                  name="caption"
                  placeholder="Write the social media caption..."
                  value={formData.caption}
                  onChange={handleInputChange}
                  className="min-h-[80px]"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Additional Notes</Label>
                <Textarea
                  id="note"
                  name="note"
                  placeholder="Any additional notes or instructions..."
                  value={formData.note}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Team Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Team Assignment</CardTitle>
              <CardDescription>
                Assign team members to work on this content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Video Editor</Label>
                  <Select
                    value={formData.assignedEditor}
                    onValueChange={(value) => handleSelectChange('assignedEditor', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select video editor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {editors.map((member) => (
                        <SelectItem key={member.user.id} value={member.user.id}>
                          {member.user.fullName} ({member.user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Social Media Manager</Label>
                  <Select
                    value={formData.assignedManager}
                    onValueChange={(value) => handleSelectChange('assignedManager', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select social media manager (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((member) => (
                        <SelectItem key={member.user.id} value={member.user.id}>
                          {member.user.fullName} ({member.user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editing Materials */}
          <Card>
            <CardHeader>
              <CardTitle>Editing Materials</CardTitle>
              <CardDescription>
                Upload files that the video editor will need for editing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                isEditingMaterial={true}
                onFilesChange={handleFilesChange}
                disabled={isLoading}
                maxFiles={10}
                accept={['image/*', 'video/*', 'audio/*', 'application/pdf', 'application/zip']}
              />
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isLoading || !formData.title || !formData.script || !formData.caption}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-border border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save as Draft'
              )}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.title || !formData.script || !formData.caption}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Creating & Uploading...</span>
                </div>
              ) : (
                'Create Brief'
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}