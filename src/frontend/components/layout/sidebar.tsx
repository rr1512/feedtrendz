'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Plus, 
  FileText, 
  Calendar, 
  FolderOpen, 
  Share2,
  Settings,
  LogOut,
  Building2
} from 'lucide-react'
import { Button } from '@/frontend/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/frontend/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/frontend/components/ui/dropdown-menu'
import { cn } from '@/frontend/lib/utils'

interface SidebarProps {
  className?: string
}

interface NavigationItem {
  name: string
  href: string
  icon: any
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Workspace',
    href: '/workspace',
    icon: Building2,
  },
  {
    name: 'Published Posts',
    href: '/published',
    icon: FileText,
  },
  {
    name: 'Scheduled Posts',
    href: '/schedule',
    icon: Calendar,
  },
  {
    name: 'Media',
    href: '/media',
    icon: FolderOpen,
  },
  {
    name: 'Social Accounts',
    href: '/social',
    icon: Share2,
  },
]

const createMenuItems = [
  {
    name: 'Create Post',
    href: '/create/post'
  },
  {
    name: 'Create Brief',
    href: '/create/brief'
  }
]

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

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

  return (
    <TooltipProvider>
      <div className={cn(
        "flex h-full w-16 flex-col border-r bg-background",
        className
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold">C</span>
          </div>
        </div>

        {/* Create Button */}
        <div className="p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" className="w-full">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-64">
              {createMenuItems.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link href={item.href} className="p-3">
                    <div className="font-medium">{item.name}</div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <li key={item.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="icon"
                        className="w-full"
                        asChild
                      >
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="p-2 space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-full" asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Settings
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-full" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Logout
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}