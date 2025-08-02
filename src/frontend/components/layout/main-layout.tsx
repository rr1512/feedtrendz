'use client'

import { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { cn } from '@/frontend/lib/utils'

interface MainLayoutProps {
  children: ReactNode
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

export function MainLayout({ 
  children, 
  className,
  user,
  workspace,
  workspaces 
}: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          user={user}
          workspace={workspace}
          workspaces={workspaces}
        />
        
        {/* Page Content */}
        <main className={cn(
          "flex-1 overflow-y-auto bg-background p-6",
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  )
}