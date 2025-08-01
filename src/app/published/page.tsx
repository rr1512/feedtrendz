'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/frontend/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card'
import { Button } from '@/frontend/components/ui/button'
import { Input } from '@/frontend/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select'
import { Badge } from '@/frontend/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/frontend/components/ui/avatar'
import { Search, Filter, Eye, MessageCircle, Share, TrendingUp, ExternalLink } from 'lucide-react'
import { formatDate, formatDateTime } from '@/frontend/lib/utils'

interface PublishedPost {
  id: string
  title: string
  caption: string
  platforms: Array<{
    platform: string
    postId: string
    publishedAt: string
    analytics: {
      views: number
      likes: number
      comments: number
      shares: number
    }
  }>
  author: {
    id: string
    name: string
    avatar?: string
  }
  publishedAt: string
  totalEngagement: number
}

export default function PublishedPage() {
  const [posts, setPosts] = useState<PublishedPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<PublishedPost[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPublishedPosts()
  }, [])

  useEffect(() => {
    filterAndSortPosts()
  }, [posts, searchTerm, platformFilter, sortBy])

  const fetchPublishedPosts = async () => {
    try {
      // TODO: Replace with actual API call
      // Simulated data for now
      const mockData: PublishedPost[] = [
        {
          id: '1',
          title: 'Product Launch Announcement',
          caption: 'Excited to announce our new product! 🚀 #ProductLaunch #Innovation',
          platforms: [
            {
              platform: 'facebook',
              postId: 'fb_123',
              publishedAt: '2024-01-15T10:00:00Z',
              analytics: { views: 1500, likes: 89, comments: 23, shares: 12 }
            },
            {
              platform: 'instagram',
              postId: 'ig_456',
              publishedAt: '2024-01-15T10:05:00Z',
              analytics: { views: 2300, likes: 156, comments: 34, shares: 8 }
            }
          ],
          author: { id: '1', name: 'Sarah Johnson', avatar: undefined },
          publishedAt: '2024-01-15T10:00:00Z',
          totalEngagement: 322
        },
        {
          id: '2',
          title: 'Behind the Scenes Video',
          caption: 'Take a look behind the scenes of our creative process! 🎬 #BTS #Creative',
          platforms: [
            {
              platform: 'tiktok',
              postId: 'tt_789',
              publishedAt: '2024-01-14T14:30:00Z',
              analytics: { views: 5600, likes: 234, comments: 67, shares: 45 }
            },
            {
              platform: 'youtube',
              postId: 'yt_012',
              publishedAt: '2024-01-14T14:35:00Z',
              analytics: { views: 1200, likes: 78, comments: 19, shares: 6 }
            }
          ],
          author: { id: '2', name: 'Mike Chen', avatar: undefined },
          publishedAt: '2024-01-14T14:30:00Z',
          totalEngagement: 449
        }
      ]

      setPosts(mockData)
    } catch (error) {
      console.error('Failed to fetch published posts:', error)
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

    // Platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter(post =>
        post.platforms.some(p => p.platform === platformFilter)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        case 'oldest':
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
        case 'engagement':
          return b.totalEngagement - a.totalEngagement
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

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook': return 'bg-blue-100 text-blue-800'
      case 'instagram': return 'bg-pink-100 text-pink-800'
      case 'tiktok': return 'bg-black text-white'
      case 'youtube': return 'bg-red-100 text-red-800'
      case 'threads': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Published Posts</h1>
          <p className="text-muted-foreground mt-2">
            Track the performance of your published content across all platforms
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{posts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {posts.reduce((sum, post) => 
                  sum + post.platforms.reduce((platformSum, platform) => 
                    platformSum + platform.analytics.views, 0
                  ), 0
                ).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {posts.reduce((sum, post) => sum + post.totalEngagement, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
              <Share className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {posts.length > 0 
                  ? Math.round(posts.reduce((sum, post) => sum + post.totalEngagement, 0) / posts.length)
                  : 0
                }
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
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="threads">Threads</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="engagement">Most Engaging</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No published posts found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || platformFilter !== 'all' 
                      ? 'Try adjusting your filters'
                      : 'Start creating and publishing content to see it here'
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
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <CardDescription>
                        Published {formatDateTime(post.publishedAt)} by {post.author.name}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {post.platforms.map((platform, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className={getPlatformColor(platform.platform)}
                        >
                          {getPlatformIcon(platform.platform)} {platform.platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.caption}
                    </p>
                  </div>

                  {/* Platform Analytics */}
                  <div className="space-y-3">
                    {post.platforms.map((platform, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getPlatformIcon(platform.platform)}</span>
                            <span className="font-medium capitalize">{platform.platform}</span>
                            <Badge variant="outline" className="text-xs">
                              ID: {platform.postId}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-lg font-semibold">
                              {platform.analytics.views.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">Views</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-red-600">
                              {platform.analytics.likes}
                            </div>
                            <div className="text-xs text-muted-foreground">Likes</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-blue-600">
                              {platform.analytics.comments}
                            </div>
                            <div className="text-xs text-muted-foreground">Comments</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-green-600">
                              {platform.analytics.shares}
                            </div>
                            <div className="text-xs text-muted-foreground">Shares</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Engagement */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm text-muted-foreground">Total Engagement</span>
                    <span className="font-semibold text-lg">{post.totalEngagement}</span>
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