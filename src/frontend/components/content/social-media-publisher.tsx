'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/frontend/components/ui/button'
import { Input } from '@/frontend/components/ui/input'
import { Label } from '@/frontend/components/ui/label'
import { Textarea } from '@/frontend/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card'
import { Badge } from '@/frontend/components/ui/badge'
import { Separator } from '@/frontend/components/ui/separator'
import { 
  Clock,
  CheckCircle,
  XCircle,
  Share2,
  Calendar,
  Facebook,
  Instagram,
  Youtube,
  Zap,
  Play,
  FileText
} from 'lucide-react'

interface ContentBrief {
  id: string
  title: string
  caption: string
  content_files?: Array<{
    id: string
    file_name: string
    file_type: string
    file_size: number
    is_editing_material: boolean
    file_url?: string
  }>
}

interface SocialAccount {
  id: string
  platform: string
  account_name: string
  status: string
}

interface SocialMediaPublisherProps {
  content: ContentBrief
  onPublishSuccess: () => void
  onPublishError: (error: string) => void
}

const platformIcons = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Share2 // Using Share2 as TikTok icon placeholder
}

const platformColors = {
  facebook: 'bg-blue-500 hover:bg-blue-600',
  instagram: 'bg-pink-500 hover:bg-pink-600',
  youtube: 'bg-red-500 hover:bg-red-600',
  tiktok: 'bg-black hover:bg-gray-800'
}

export function SocialMediaPublisher({ 
  content, 
  onPublishSuccess, 
  onPublishError 
}: SocialMediaPublisherProps) {
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [customTitle, setCustomTitle] = useState(content.title)
  const [customCaption, setCustomCaption] = useState(content.caption)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishResults, setPublishResults] = useState<any[]>([])
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDateTime, setScheduledDateTime] = useState('')

  useEffect(() => {
    fetchSocialAccounts()
  }, [])

  const fetchSocialAccounts = async () => {
    try {
      const response = await fetch('/api/social/accounts')
      const result = await response.json()
      
      if (result.success) {
        const connectedAccounts = result.data.filter((account: any) => account.status === 'connected')
        setSocialAccounts(connectedAccounts)
      }
    } catch (error) {
      console.error('Failed to fetch social accounts:', error)
    }
  }

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      onPublishError('Please select at least one platform')
      return
    }

    if (!customCaption.trim()) {
      onPublishError('Caption is required')
      return
    }

    setIsPublishing(true)
    setPublishResults([])

    try {
      const publishData = {
        contentId: content.id,
        platforms: selectedPlatforms,
        title: customTitle.trim() || undefined,
        caption: customCaption.trim(),
        scheduledAt: isScheduled ? scheduledDateTime : undefined
      }

      const response = await fetch('/api/social/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(publishData)
      })

      const result = await response.json()

      if (result.success) {
        setPublishResults(result.data.results || [])
        
        if (result.data.failed === 0) {
          onPublishSuccess()
        } else {
          onPublishError(`Published to ${result.data.successful}/${selectedPlatforms.length} platforms. Some failed.`)
        }
      } else {
        onPublishError(result.error || 'Failed to publish content')
      }
    } catch (error) {
      console.error('Publish error:', error)
      onPublishError('Failed to publish content')
    } finally {
      setIsPublishing(false)
    }
  }

  const connectedPlatforms = socialAccounts.map(account => account.platform)
  const availablePlatforms = ['facebook', 'instagram', 'youtube', 'tiktok'].filter(
    platform => connectedPlatforms.includes(platform)
  )

  if (availablePlatforms.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Share2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">No Social Media Accounts Connected</p>
            <p className="text-sm mt-1">
              Connect your social media accounts in the{' '}
              <a href="/social" className="text-blue-600 hover:underline">
                Social Media page
              </a>{' '}
              to publish content.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Platform Selection */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Select Platforms</Label>
        <div className="grid grid-cols-2 gap-2">
          {availablePlatforms.map((platform) => {
            const Icon = platformIcons[platform as keyof typeof platformIcons]
            const isSelected = selectedPlatforms.includes(platform)
            const account = socialAccounts.find(acc => acc.platform === platform)
            
            return (
              <button
                key={platform}
                onClick={() => handlePlatformToggle(platform)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-sm font-medium capitalize">{platform}</p>
                    <p className="text-xs text-gray-500">{account?.account_name}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-blue-500 ml-auto" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Customization */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Customize Content</Label>
        
        {/* Title (for platforms that support it) */}
        <div>
          <Label htmlFor="custom-title" className="text-xs text-gray-600">
            Title (for YouTube, etc.)
          </Label>
          <Input
            id="custom-title"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Enter title..."
            className="mt-1"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">{customTitle.length}/100 characters</p>
        </div>

        {/* Caption */}
        <div>
          <Label htmlFor="custom-caption" className="text-xs text-gray-600">
            Caption/Description
          </Label>
          <Textarea
            id="custom-caption"
            value={customCaption}
            onChange={(e) => setCustomCaption(e.target.value)}
            placeholder="Enter caption..."
            className="mt-1 min-h-[100px]"
            maxLength={2200}
          />
          <p className="text-xs text-gray-500 mt-1">{customCaption.length}/2200 characters</p>
        </div>
      </div>

      {/* Schedule Option */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="schedule-post"
            checked={isScheduled}
            onChange={(e) => setIsScheduled(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="schedule-post" className="text-sm">Schedule for later</Label>
        </div>

        {isScheduled && (
          <div>
            <Label htmlFor="schedule-datetime" className="text-xs text-gray-600">
              Schedule Date & Time
            </Label>
            <Input
              id="schedule-datetime"
              type="datetime-local"
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="mt-1"
            />
          </div>
        )}
      </div>

      {/* Media Preview */}
      {content.content_files && content.content_files.filter(f => !f.is_editing_material).length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-2 block">Media Files</Label>
          <div className="grid grid-cols-2 gap-2">
            {content.content_files
              .filter(file => !file.is_editing_material)
              .slice(0, 4)
              .map((file, index) => (
                <div key={file.id} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  {file.file_type.startsWith('image/') ? (
                    <img 
                      src={file.file_url || `/uploads/${file.file_name}`} 
                      alt={file.file_name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : file.file_type.startsWith('video/') ? (
                    <div className="text-center">
                      <Play className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Video</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">File</p>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Publish Results */}
      {publishResults.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Publish Results</Label>
          {publishResults.map((result, index) => (
            <div key={index} className={`p-3 rounded-lg border ${
              result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <p className="text-sm font-medium capitalize">{result.platform}</p>
                <span className={`text-xs px-2 py-1 rounded ${
                  result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {result.success ? 'Success' : 'Failed'}
                </span>
              </div>
              {result.error && (
                <p className="text-xs text-red-600 mt-1">{result.error}</p>
              )}
              {result.postId && (
                <p className="text-xs text-green-600 mt-1">Post ID: {result.postId}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Publish Button */}
      <div className="pt-2">
        <Button
          onClick={handlePublish}
          disabled={isPublishing || selectedPlatforms.length === 0}
          className="w-full"
          size="lg"
        >
          {isPublishing ? (
            <>
              <Zap className="w-4 h-4 mr-2 animate-spin" />
              {isScheduled ? 'Scheduling...' : 'Publishing...'}
            </>
          ) : (
            <>
              {isScheduled ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule Post
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Publish Now
                </>
              )}
            </>
          )}
        </Button>
        
        {selectedPlatforms.length > 0 && (
          <p className="text-xs text-gray-500 text-center mt-2">
            Will {isScheduled ? 'schedule' : 'publish'} to {selectedPlatforms.length} platform(s)
          </p>
        )}
      </div>
    </div>
  )
}