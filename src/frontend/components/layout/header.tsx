'use client'

import { useState } from 'react'
import { Bell, ChevronDown, User, Settings, Plus } from 'lucide-react'
import { Button } from '@/frontend/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/frontend/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/frontend/components/ui/dropdown-menu'
import { cn } from '@/frontend/lib/utils'

interface HeaderProps {
  className?: string
  user?: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string
    role?: string
  }
  workspace?: {
    id: string
    name: string
  }
  workspaces?: Array<{
    workspace: {
      id: string
      name: string
    }
    role: string
  }>
}

export function Header({ 
  className, 
  user,
  workspace,
  workspaces = []
}: HeaderProps) {
  const [notifications] = useState([
    {
      id: '1',
      title: 'New content brief assigned',
      message: 'You have been assigned to edit "Product Launch Video"',
      time: '5 min ago',
      isRead: false
    },
    {
      id: '2',
      title: 'Content approved',
      message: 'Your edited video has been approved for publishing',
      time: '1 hour ago',
      isRead: false
    },
    {
      id: '3',
      title: 'Workspace invitation',
      message: 'You have been invited to join "Marketing Team" workspace',
      time: '2 hours ago',
      isRead: true
    }
  ])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleWorkspaceChange = async (workspaceId: string) => {
    try {
      const response = await fetch('/api/workspace/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workspaceId })
      })

      if (response.ok) {
        // Reload page to update workspace context
        window.location.reload()
      } else {
        console.error('Failed to switch workspace')
      }
    } catch (error) {
      console.error('Error switching workspace:', error)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      
      if (response.ok) {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const getUserInitials = (name: string) => {
    if (!name || typeof name !== 'string') {
      return 'U'
    }
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className={cn(
      "flex h-16 items-center justify-between border-b bg-background px-6",
      className
    )}>
      {/* Left side - could be breadcrumbs or page title */}
      <div className="flex items-center">
        <h1 className="text-lg font-semibold">
          {/* This will be dynamic based on current page */}
        </h1>
      </div>

      {/* Right side - Workspace, Notifications, Profile */}
      <div className="flex items-center space-x-4">
        {/* Workspace Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[160px] justify-between">
              <span className="truncate">
                {workspace?.name || 'Select Workspace'}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {workspaces.map(({ workspace: ws, role }) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => handleWorkspaceChange(ws.id)}
                className="flex flex-col items-start"
              >
                <div className="font-medium">{ws.name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {role.replace('_', ' ')}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/workspace/create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Workspace
              </a>
            </DropdownMenuItem>
            {workspace && (
              <DropdownMenuItem asChild>
                <a href={`/workspace?id=${workspace.id}`} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Workspace Settings
                </a>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs text-destructive-foreground flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px]">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start p-4 space-y-1"
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className={cn(
                        "font-medium text-sm",
                        !notification.isRead && "text-primary"
                      )}>
                        {notification.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {notification.time}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {notification.message}
                    </div>
                    {!notification.isRead && (
                      <div className="h-1 w-1 rounded-full bg-primary ml-auto" />
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                <AvatarFallback>
                  {user?.fullName ? getUserInitials(user.fullName) : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.fullName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                {user?.role && (
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {user.role.replace('_', ' ')}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/profile">Profile</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/settings">Settings</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}