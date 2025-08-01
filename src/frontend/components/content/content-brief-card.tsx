'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card'
import { Badge } from '@/frontend/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/frontend/components/ui/avatar'
import { FileText, Calendar, User, MessageSquare, Download } from 'lucide-react'
import { ContentBriefDetailModal } from './content-brief-detail-modal'

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

interface ContentBriefCardProps {
  content: ContentBrief
  onUpdate?: () => void
  userRole?: string
  currentWorkspace?: {
    id: string
    name: string
    userRole: string
  }
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  waiting_for_editor: 'bg-yellow-100 text-yellow-800',
  edited: 'bg-blue-100 text-blue-800',
  review: 'bg-purple-100 text-purple-800',
  revision: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800',
  scheduled: 'bg-indigo-100 text-indigo-800',
  published: 'bg-emerald-100 text-emerald-800'
}

const statusLabels = {
  draft: 'Draft',
  waiting_for_editor: 'Waiting for Editor',
  edited: 'Edited',
  review: 'Review',
  revision: 'Revision',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published'
}

export function ContentBriefCard({ content, onUpdate, userRole, currentWorkspace }: ContentBriefCardProps) {
  const [showDetail, setShowDetail] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
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

  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'draft':
        return 'from-gray-400 to-gray-600'
      case 'waiting_for_editor':
        return 'from-yellow-400 to-orange-500'
      case 'edited':
        return 'from-blue-400 to-blue-600'
      case 'review':
        return 'from-purple-400 to-purple-600'
      case 'revision':
        return 'from-orange-400 to-red-500'
      case 'approved':
        return 'from-green-400 to-green-600'
      case 'scheduled':
        return 'from-indigo-400 to-indigo-600'
      case 'published':
        return 'from-emerald-400 to-emerald-600'
      default:
        return 'from-gray-400 to-gray-600'
    }
  }

  const editingMaterials = content.content_files?.filter(file => file.is_editing_material) || []
  const editedFiles = content.content_files?.filter(file => !file.is_editing_material) || []

  return (
    <>
      <Card 
        className="group h-full cursor-pointer bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
        onClick={() => setShowDetail(true)}
      >
        
        {/* Status indicator line */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getStatusGradient(content.status)}`} />
        
        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
                {content.title}
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-1 font-medium">
                Created {formatDate(content.created_at)}
              </CardDescription>
            </div>
            <Badge className={`ml-2 shadow-sm border-0 font-semibold ${statusColors[content.status]}`}>
              {statusLabels[content.status]}
            </Badge>
          </div>
          
          {content.label && (
            <div className="flex items-center gap-2 mt-3">
              <Badge 
                variant="outline" 
                className="text-xs border-blue-200 text-blue-700 bg-blue-50 font-medium"
              >
                {content.label}
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0 relative z-10">
          <div className="space-y-4">
            {/* Script preview */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Script
              </h4>
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {content.script}
              </p>
            </div>

            {/* Team members */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                {/* Creator */}
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{content.created_by_user.full_name}</span>
                </div>

                {/* Editor */}
                {content.assigned_editor_user && (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="w-5 h-5 border border-white shadow-sm">
                      <AvatarImage src={content.assigned_editor_user.avatar_url} />
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700 font-semibold">
                        {getInitials(content.assigned_editor_user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-gray-600 font-medium">{content.assigned_editor_user.full_name}</span>
                  </div>
                )}

                {/* Manager */}
                {content.assigned_manager_user && (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="w-5 h-5 border border-white shadow-sm">
                      <AvatarImage src={content.assigned_manager_user.avatar_url} />
                      <AvatarFallback className="text-xs bg-green-100 text-green-700 font-semibold">
                        {getInitials(content.assigned_manager_user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-gray-600 font-medium">{content.assigned_manager_user.full_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Files info */}
            {(editingMaterials.length > 0 || editedFiles.length > 0) && (
              <div className="flex items-center gap-4 text-xs pt-3 border-t border-gray-100">
                {editingMaterials.length > 0 && (
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="font-medium">{editingMaterials.length} material{editingMaterials.length > 1 ? 's' : ''}</span>
                  </div>
                )}
                
                {editedFiles.length > 0 && (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <Download className="w-3.5 h-3.5" />
                    <span className="font-medium">{editedFiles.length} edited file{editedFiles.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}


          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <ContentBriefDetailModal
        content={content}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        onUpdate={() => {
          onUpdate?.()
          setShowDetail(false)
        }}
        userRole={userRole}
        currentWorkspace={currentWorkspace}
      />
    </>
  )
}