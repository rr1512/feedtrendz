'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/frontend/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card'
import { ContentBriefCard } from '@/frontend/components/content/content-brief-card'
import { FileText, Calendar, Users, TrendingUp } from 'lucide-react'

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
    file_url?: string
    is_editing_material: boolean
  }>
}

interface DashboardData {
  user: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string
    role?: string
  }
  currentWorkspace: {
    id: string
    name: string
    userRole: string
    members: Array<{
      user: {
        id: string
        email: string
        fullName: string
        avatarUrl?: string
      }
      role: string
    }>
  }
  workspaces: Array<{
    workspace: {
      id: string
      name: string
    }
    role: string
  }>
  stats: {
    totalContent: number
    publishedContent: number
    editingContent: number
    scheduledContent: number
  }
  contentBriefs: ContentBrief[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch('/api/auth/me')
        const userResult = await userResponse.json()

        if (!userResult.success) {
          setError(userResult.error || 'Failed to load user data')
          return
        }

        // Get current workspace from user data
        const currentWorkspace = userResult.data.currentWorkspace
        
        // Fetch content briefs for current workspace
        let contentBriefs = []
        if (currentWorkspace) {
          const contentResponse = await fetch(`/api/content?limit=6`, {
            headers: {
              'x-workspace-id': currentWorkspace.id
            }
          })
          const contentResult = await contentResponse.json()
          contentBriefs = contentResult.success ? contentResult.data.content || [] : []
        }

        // Calculate real stats from content briefs
        const stats = {
          totalContent: contentBriefs.length,
          publishedContent: contentBriefs.filter((c: ContentBrief) => c.status === 'published').length,
          editingContent: contentBriefs.filter((c: ContentBrief) => 
            ['waiting_for_editor', 'edited', 'review', 'revision'].includes(c.status)
          ).length,
          scheduledContent: contentBriefs.filter((c: ContentBrief) => c.status === 'scheduled').length
        }

        setData({
          user: userResult.data.user,
          currentWorkspace: userResult.data.currentWorkspace,
          workspaces: userResult.data.workspaces,
          stats,
          contentBriefs
        })
      } catch (error) {
        setError('An error occurred while loading data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const refreshContentBriefs = async () => {
    try {
      if (!data?.currentWorkspace) return
      
      const response = await fetch(`/api/content?limit=6`, {
        headers: {
          'x-workspace-id': data.currentWorkspace.id
        }
      })
      const result = await response.json()
      
      if (result.success && data) {
        const contentBriefs = result.data.content || []
        const stats = {
          totalContent: contentBriefs.length,
          publishedContent: contentBriefs.filter((c: ContentBrief) => c.status === 'published').length,
          editingContent: contentBriefs.filter((c: ContentBrief) => 
            ['waiting_for_editor', 'edited', 'review', 'revision'].includes(c.status)
          ).length,
          scheduledContent: contentBriefs.filter((c: ContentBrief) => c.status === 'scheduled').length
        }
        
        setData({
          ...data,
          stats,
          contentBriefs
        })
      }
    } catch (error) {
      console.error('Failed to refresh content briefs:', error)
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

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const stats = [
    {
      title: 'Total Content',
      value: data?.stats.totalContent || 0,
      description: 'Content pieces created',
      icon: FileText,
    },
    {
      title: 'Published',
      value: data?.stats.publishedContent || 0,
      description: 'Successfully published',
      icon: TrendingUp,
    },
    {
      title: 'In Progress',
      value: data?.stats.editingContent || 0,
      description: 'Currently being edited',
      icon: Users,
    },
    {
      title: 'Scheduled',
      value: data?.stats.scheduledContent || 0,
      description: 'Ready to publish',
      icon: Calendar,
    },
  ]

  return (
    <MainLayout 
      user={data?.user}
      workspace={data?.currentWorkspace}
      workspaces={data?.workspaces}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {data?.user.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your content today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Content Briefs */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Content Briefs</h2>
              <p className="text-muted-foreground">
                Collaborative content in your workspace
              </p>
            </div>
          </div>

          {data?.contentBriefs && data.contentBriefs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.contentBriefs.map((content) => (
                <ContentBriefCard
                  key={content.id}
                  content={content}
                  onUpdate={refreshContentBriefs}
                  userRole={data.currentWorkspace.userRole}
                  currentWorkspace={data.currentWorkspace}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Content Briefs Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first content brief to start collaborating with your team.
                </p>
                <a 
                  href="/create/brief"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                >
                  Create Brief
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  )
}