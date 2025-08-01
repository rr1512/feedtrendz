'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/frontend/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card'
import { Button } from '@/frontend/components/ui/button'
import { Input } from '@/frontend/components/ui/input'
import { Label } from '@/frontend/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/frontend/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/frontend/components/ui/avatar'
import { Badge } from '@/frontend/components/ui/badge'
import { 
  Settings, 
  Users, 
  UserPlus, 
  Trash2, 
  Edit2, 
  Save,
  X,
  Crown,
  Mail,
  Calendar
} from 'lucide-react'

interface WorkspaceMember {
  user: {
    id: string
    email: string
    fullName: string
    avatarUrl?: string
  }
  role: string
  joinedAt: string
}

interface WorkspaceData {
  id: string
  name: string
  userRole: string
  members: WorkspaceMember[]
  owner: {
    id: string
    fullName: string
    email: string
  }
}

interface DashboardData {
  user: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string
    role?: string
  }
  currentWorkspace: WorkspaceData
}

export default function WorkspacePage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [isSaving, setSaving] = useState(false)
  
  // Invite dialog state
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteData, setInviteData] = useState({
    email: '',
    role: ''
  })
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    fetchWorkspaceData()
  }, [])

  const fetchWorkspaceData = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setEditedName(result.data.currentWorkspace.name)
      } else {
        setError(result.error || 'Failed to load workspace data')
      }
    } catch (error) {
      setError('An error occurred while loading data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveWorkspaceName = async () => {
    if (!editedName.trim()) return

    setSaving(true)
    try {
      const response = await fetch('/api/workspace/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editedName.trim() }),
      })

      const result = await response.json()

      if (result.success) {
        setData(prev => prev ? {
          ...prev,
          currentWorkspace: {
            ...prev.currentWorkspace,
            name: editedName.trim()
          }
        } : null)
        setIsEditing(false)
      } else {
        setError(result.error || 'Failed to update workspace name')
      }
    } catch (error) {
      setError('An error occurred while updating workspace')
    } finally {
      setSaving(false)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteData.email.trim() || !inviteData.role) {
      setInviteError('Please fill in all fields')
      return
    }

    setIsInviting(true)
    setInviteError('')

    try {
      const response = await fetch('/api/workspace/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData),
      })

      const result = await response.json()

      if (result.success) {
        // Refresh workspace data to show new member
        await fetchWorkspaceData()
        setIsInviteOpen(false)
        setInviteData({ email: '', role: '' })
      } else {
        setInviteError(result.error || 'Failed to invite user')
      }
    } catch (error) {
      setInviteError('An error occurred while inviting user')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) {
      return
    }

    try {
      const response = await fetch(`/api/workspace/members/${memberId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Refresh workspace data
        await fetchWorkspaceData()
      } else {
        setError(result.error || 'Failed to remove member')
      }
    } catch (error) {
      setError('An error occurred while removing member')
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/workspace/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      const result = await response.json()

      if (result.success) {
        // Refresh workspace data
        await fetchWorkspaceData()
      } else {
        setError(result.error || 'Failed to update member role')
      }
    } catch (error) {
      setError('An error occurred while updating member role')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
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

  const roleLabels = {
    owner: 'Owner',
    script_writer: 'Script Writer',
    video_editor: 'Video Editor',
    social_media_manager: 'Social Media Manager'
  }

  const roleColors = {
    owner: 'bg-purple-100 text-purple-800',
    script_writer: 'bg-blue-100 text-blue-800',
    video_editor: 'bg-green-100 text-green-800',
    social_media_manager: 'bg-orange-100 text-orange-800'
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
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p>No workspace data available</p>
        </div>
      </MainLayout>
    )
  }

  const isOwner = data.currentWorkspace.userRole === 'owner'

  return (
    <MainLayout user={data.user} workspace={data.currentWorkspace}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workspace Settings</h1>
            <p className="text-muted-foreground">
              Manage your workspace settings and team members
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Workspace General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Update your workspace name and basic settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Input
                        id="workspace-name"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Enter workspace name"
                        disabled={!isOwner || isSaving}
                      />
                      <Button
                        onClick={handleSaveWorkspaceName}
                        disabled={isSaving || !editedName.trim()}
                        size="sm"
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false)
                          setEditedName(data.currentWorkspace.name)
                        }}
                        variant="outline"
                        size="sm"
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        value={data.currentWorkspace.name}
                        disabled
                        className="flex-1"
                      />
                      {isOwner && (
                        <Button
                          onClick={() => setIsEditing(true)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
                {!isOwner && (
                  <p className="text-sm text-muted-foreground">
                    Only workspace owners can change the workspace name
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members ({data.currentWorkspace.members.length})
                  </CardTitle>
                  <CardDescription>
                    Manage your team members and their roles
                  </CardDescription>
                </div>
                {isOwner && (
                  <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                          Send an invitation to join your workspace
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {inviteError && (
                          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                            {inviteError}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="invite-email">Email Address</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            placeholder="Enter email address"
                            value={inviteData.email}
                            onChange={(e) => setInviteData(prev => ({ 
                              ...prev, 
                              email: e.target.value 
                            }))}
                            disabled={isInviting}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invite-role">Role</Label>
                          <Select
                            value={inviteData.role}
                            onValueChange={(value) => setInviteData(prev => ({ 
                              ...prev, 
                              role: value 
                            }))}
                            disabled={isInviting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="script_writer">Script Writer</SelectItem>
                              <SelectItem value="video_editor">Video Editor</SelectItem>
                              <SelectItem value="social_media_manager">Social Media Manager</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleInviteUser}
                            disabled={isInviting || !inviteData.email || !inviteData.role}
                            className="flex-1"
                          >
                            {isInviting ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Inviting...
                              </>
                            ) : (
                              <>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Invitation
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsInviteOpen(false)
                              setInviteData({ email: '', role: '' })
                              setInviteError('')
                            }}
                            disabled={isInviting}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.currentWorkspace.members.map((member) => (
                  <div
                    key={member.user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.user.avatarUrl} />
                        <AvatarFallback>
                          {getInitials(member.user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.user.fullName}</p>
                          {member.role === 'owner' && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={roleColors[member.role as keyof typeof roleColors]}>
                            {roleLabels[member.role as keyof typeof roleLabels]}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined {formatDate(member.joinedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isOwner && member.role !== 'owner' && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(newRole) => handleUpdateRole(member.user.id, newRole)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="script_writer">Script Writer</SelectItem>
                            <SelectItem value="video_editor">Video Editor</SelectItem>
                            <SelectItem value="social_media_manager">Social Media Manager</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMember(member.user.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}