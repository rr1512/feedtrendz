'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/frontend/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card'
import { Button } from '@/frontend/components/ui/button'
import { Input } from '@/frontend/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select'
import { Badge } from '@/frontend/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/frontend/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/frontend/components/ui/dialog'
import { Search, Calendar, Clock, Edit, Trash2, Play, Pause } from 'lucide-react'
import { formatDate, formatDateTime } from '@/frontend/lib/utils'

interface ScheduledPost {
  id: string
  title: string
  caption: string
  scheduledAt: string
  platforms: Array<{
    platform: string
    accountName: string
  }>
  status: 'scheduled' | 'publishing' | 'published' | 'failed'
  author: {
    id: string
    name: string
    avatar?: string
  }
  createdAt: string
  errorMessage?: string
}

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<ScheduledPost[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('scheduled_time')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)

  useEffect(() => {
    fetchScheduledPosts()
  }, [])

  useEffect(() => {
    filterAndSortPosts()
  }, [posts, searchTerm, statusFilter, sortBy])

  const fetchScheduledPosts = async () => {
    try {
      // TODO: Replace with actual API call
      // Simulated data for now
      const mockData: ScheduledPost[] = [
        {
          id: '1',
          title: 'Weekly Product Update',
          caption: 'Check out our latest features and improvements! 🚀 #ProductUpdate #Innovation',
          scheduledAt: '2024-01-20T15:00:00Z',
          platforms: [
            { platform: 'facebook', accountName: 'My Facebook Page' },
            { platform: 'instagram', accountName: '@myinstagram' }
          ],
          status: 'scheduled',
          author: { id: '1', name: 'Sarah Johnson', avatar: undefined },
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          title: 'Tutorial Tuesday',
          caption: 'Learn something new with our step-by-step tutorial! 📚 #TutorialTuesday #Learning',
          scheduledAt: '2024-01-23T12:00:00Z',
          platforms: [
            { platform: 'youtube', accountName: 'My YouTube Channel' },
            { platform: 'tiktok', accountName: '@mytiktok' }
          ],
          status: 'scheduled',
          author: { id: '2', name: 'Mike Chen', avatar: undefined },
          createdAt: '2024-01-16T14:30:00Z'
        },
        {
          id: '3',
          title: 'Failed Campaign Post',
          caption: 'This post failed to publish due to API error',
          scheduledAt: '2024-01-18T10:00:00Z',
          platforms: [
            { platform: 'facebook', accountName: 'My Facebook Page' }
          ],
          status: 'failed',
          author: { id: '1', name: 'Sarah Johnson', avatar: undefined },
          createdAt: '2024-01-17T09:00:00Z',
          errorMessage: 'Facebook API rate limit exceeded. Please try again later.'
        }
      ]

      setPosts(mockData)
    } catch (error) {
      console.error('Failed to fetch scheduled posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortPosts = () => {
    let filtered = posts

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.caption.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'scheduled_time':
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        case 'created_date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    setFilteredPosts(filtered)
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return '📘'
      case 'instagram': return '📸'
      case 'tiktok': return '🎵'
      case 'youtube': return '📺'
      case 'threads': return '🧵'
      default: return '📱'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'publishing': return 'bg-yellow-100 text-yellow-800'
      case 'published': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-3 w-3" />
      case 'publishing': return <Play className="h-3 w-3" />
      case 'published': return <Calendar className="h-3 w-3" />
      case 'failed': return <Pause className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const handleDeletePost = async (postId: string) => {
    // TODO: Implement delete scheduled post
    console.log('Deleting post:', postId)
    setPosts(posts.filter(p => p.id !== postId))
  }

  const handleReschedulePost = async (postId: string) => {
    // TODO: Implement reschedule post
    console.log('Rescheduling post:', postId)
  }

  const handlePublishNow = async (postId: string) => {
    // TODO: Implement publish now
    console.log('Publishing now:', postId)
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scheduled Posts</h1>
          <p className="text-muted-foreground mt-2">
            Manage your scheduled content and upcoming publications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {posts.filter(p => p.status === 'scheduled').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Publishing Soon</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {posts.filter(p => 
                  p.status === 'scheduled' && 
                  new Date(p.scheduledAt).getTime() - Date.now() < 24 * 60 * 60 * 1000
                ).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recently Published</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {posts.filter(p => p.status === 'published').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Posts</CardTitle>
              <Pause className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {posts.filter(p => p.status === 'failed').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scheduled posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="publishing">Publishing</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled_time">Scheduled Time</SelectItem>
              <SelectItem value="created_date">Created Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No scheduled posts found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your filters'
                      : 'Schedule your first post to see it here'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        <Badge 
                          variant="secondary" 
                          className={getStatusColor(post.status)}
                        >
                          {getStatusIcon(post.status)}
                          {post.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Created by {post.author.name} • {formatDateTime(post.createdAt)}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedPost(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Scheduled Post</DialogTitle>
                            <DialogDescription>
                              Modify the details of your scheduled post
                            </DialogDescription>
                          </DialogHeader>
                          {/* TODO: Add edit form */}
                          <div className="p-4">
                            <p>Edit form will be implemented here</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.caption}
                    </p>
                  </div>

                  {/* Schedule Info */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        Scheduled for {formatDateTime(post.scheduledAt)}
                      </span>
                    </div>
                    
                    {post.status === 'scheduled' && (
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleReschedulePost(post.id)}
                        >
                          Reschedule
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handlePublishNow(post.id)}
                        >
                          Publish Now
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {post.status === 'failed' && post.errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Pause className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-red-800">Publishing Failed</div>
                          <div className="text-sm text-red-600">{post.errorMessage}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Platforms */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Publishing to:</span>
                    {post.platforms.map((platform, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {getPlatformIcon(platform.platform)} {platform.accountName}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  )
}