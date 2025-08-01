'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/frontend/components/layout/main-layout'
import { Button } from '@/frontend/components/ui/button'
import { Input } from '@/frontend/components/ui/input'
import { Textarea } from '@/frontend/components/ui/textarea'
import { Label } from '@/frontend/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select'
import { ArrowLeft, Calendar, Clock, Share2 } from 'lucide-react'
import { FileUpload } from '@/frontend/components/ui/file-upload'
import { cn } from '@/frontend/lib/utils'

interface CreatePostFormData {
  title: string
  caption: string
  scheduledAt: string
  platforms: string[]
}

interface SocialAccount {
  id: string
  platform: string
  accountName: string
  isActive: boolean
}

export default function CreatePostPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<CreatePostFormData>({
    title: '',
    caption: '',
    scheduledAt: '',
    platforms: []
  })
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([])
  const [postType, setPostType] = useState<'immediate' | 'scheduled'>('immediate')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdContentId, setCreatedContentId] = useState<string | null>(null)

  useEffect(() => {
    // TODO: Fetch connected social accounts
    // For now, using mock data
    setSocialAccounts([
      { id: '1', platform: 'facebook', accountName: 'My Facebook Page', isActive: true },
      { id: '2', platform: 'instagram', accountName: '@myinstagram', isActive: true },
      { id: '3', platform: 'tiktok', accountName: '@mytiktok', isActive: false },
      { id: '4', platform: 'youtube', accountName: 'My YouTube Channel', isActive: true }
    ])
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePlatformToggle = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(id => id !== platformId)
        : [...prev.platforms, platformId]
    }))
  }

  const handleUploadSuccess = (uploadedFiles: any[]) => {
    console.log('Media files uploaded successfully:', uploadedFiles)
    // Files are automatically saved to the content, no need to do anything else
  }

  const handleUploadError = (error: string) => {
    setError(`Media upload failed: ${error}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // TODO: Implement post creation and scheduling
      console.log('Creating post:', { formData, postType })
      
      // First create the content brief for the post
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          script: formData.caption, // Use caption as script for posts
          caption: formData.caption,
          note: `Post type: ${postType}${formData.scheduledAt ? ` | Scheduled for: ${formData.scheduledAt}` : ''}`,
          label: 'Social Media Post'
        }),
      })

      const data = await response.json()

      if (data.success) {
        setCreatedContentId(data.data.id)
        // TODO: Implement actual posting/scheduling logic
        router.push('/dashboard')
      } else {
        setError(data.error || 'Failed to create post')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return '📘'
      case 'instagram':
        return '📸'
      case 'tiktok':
        return '🎵'
      case 'youtube':
        return '📺'
      case 'threads':
        return '🧵'
      default:
        return '📱'
    }
  }

  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 5) // At least 5 minutes from now
    return now.toISOString().slice(0, 16)
  }

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
            <h1 className="text-3xl font-bold tracking-tight">Create Post</h1>
            <p className="text-muted-foreground">
              Create and publish content directly to social media
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing Options</CardTitle>
              <CardDescription>
                Choose how you want to publish this content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-colors",
                    postType === 'immediate' 
                      ? "border-primary bg-primary/5" 
                      : "border-muted hover:border-muted-foreground/50"
                  )}
                  onClick={() => setPostType('immediate')}
                >
                  <div className="flex items-center space-x-3">
                    <Share2 className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Publish Now</div>
                      <div className="text-sm text-muted-foreground">
                        Post immediately to selected platforms
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-colors",
                    postType === 'scheduled' 
                      ? "border-primary bg-primary/5" 
                      : "border-muted hover:border-muted-foreground/50"
                  )}
                  onClick={() => setPostType('scheduled')}
                >
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Schedule Post</div>
                      <div className="text-sm text-muted-foreground">
                        Schedule for a specific date and time
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Information */}
          <Card>
            <CardHeader>
              <CardTitle>Content Information</CardTitle>
              <CardDescription>
                Provide the details for your post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Post Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter post title (for internal reference)"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Caption *</Label>
                <Textarea
                  id="caption"
                  name="caption"
                  placeholder="Write your post caption..."
                  value={formData.caption}
                  onChange={handleInputChange}
                  className="min-h-[120px]"
                  required
                  disabled={isLoading}
                />
                <div className="text-xs text-muted-foreground">
                  Character count: {formData.caption.length}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Settings */}
          {postType === 'scheduled' && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule Settings</CardTitle>
                <CardDescription>
                  Set when you want this post to be published
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Schedule Date & Time *</Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="scheduledAt"
                      name="scheduledAt"
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={handleInputChange}
                      min={getMinDateTime()}
                      required={postType === 'scheduled'}
                      disabled={isLoading}
                      className="max-w-xs"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Posts can be scheduled at least 5 minutes from now
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platform Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media Platforms</CardTitle>
              <CardDescription>
                Select which platforms to publish to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socialAccounts.map((account) => (
                  <div
                    key={account.id}
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer transition-colors",
                      !account.isActive && "opacity-50 cursor-not-allowed",
                      formData.platforms.includes(account.id) && account.isActive
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50"
                    )}
                    onClick={() => account.isActive && handlePlatformToggle(account.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{getPlatformIcon(account.platform)}</span>
                      <div className="flex-1">
                        <div className="font-medium capitalize">
                          {account.platform}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {account.accountName}
                        </div>
                        {!account.isActive && (
                          <div className="text-xs text-destructive">
                            Not connected
                          </div>
                        )}
                      </div>
                      {formData.platforms.includes(account.id) && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {formData.platforms.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Please select at least one platform to publish to
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Media Files</CardTitle>
              <CardDescription>
                Upload images or videos for your post
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                contentId={createdContentId || undefined}
                isEditingMaterial={false}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                disabled={isLoading}
                maxFiles={5}
                accept={['image/*', 'video/*']}
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
              type="submit"
              disabled={
                isLoading || 
                !formData.title || 
                !formData.caption || 
                formData.platforms.length === 0 ||
                (postType === 'scheduled' && !formData.scheduledAt)
              }
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>
                    {postType === 'immediate' ? 'Publishing...' : 'Scheduling...'}
                  </span>
                </div>
              ) : (
                postType === 'immediate' ? 'Publish Now' : 'Schedule Post'
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}