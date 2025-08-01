import { supabaseAdmin } from '../config/database'
import type { ContentBriefInput, UpdateContentStatusInput } from '../utils/validation'

export class ContentService {
  // Create new content brief
  static async createContentBrief(workspaceId: string, userId: string, data: ContentBriefInput) {
    try {
      // Verify user is member of workspace
      const { data: member, error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single()

      if (memberError || !member) {
        throw new Error('Access denied: Not a member of this workspace')
      }

      // Create content brief
      const { data: content, error: contentError } = await supabaseAdmin
        .from('content_briefs')
        .insert({
          workspace_id: workspaceId,
          title: data.title,
          script: data.script,
          caption: data.caption,
          note: data.note || null,
          label: data.label || null,
          created_by: userId,
          assigned_editor: data.assignedEditor || null,
          assigned_manager: data.assignedManager || null,
          status: data.status || 'waiting_for_editor'
        })
        .select(`
          *,
          created_by_user:created_by (
            id,
            full_name,
            email,
            avatar_url
          ),
          assigned_editor_user:assigned_editor (
            id,
            full_name,
            email,
            avatar_url
          ),
          assigned_manager_user:assigned_manager (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .single()

      if (contentError) {
        throw new Error(`Failed to create content brief: ${contentError.message}`)
      }

      return content
    } catch (error) {
      throw error
    }
  }

  // Get content briefs for workspace
  static async getContentBriefs(workspaceId: string, userId: string, filters?: {
    status?: string
    assignedToMe?: boolean
    page?: number
    limit?: number
  }) {
    try {
      // Verify user is member of workspace
      const { data: member, error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single()

      if (memberError || !member) {
        throw new Error('Access denied: Not a member of this workspace')
      }

      let query = supabaseAdmin
        .from('content_briefs')
        .select(`
          *,
          created_by_user:created_by (
            id,
            full_name,
            email,
            avatar_url
          ),
          assigned_editor_user:assigned_editor (
            id,
            full_name,
            email,
            avatar_url
          ),
          assigned_manager_user:assigned_manager (
            id,
            full_name,
            email,
            avatar_url
          ),
          content_files (
            id,
            file_name,
            file_type,
            file_size,
            file_url,
            is_editing_material
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.assignedToMe) {
        query = query.or(`assigned_editor.eq.${userId},assigned_manager.eq.${userId},created_by.eq.${userId}`)
      }

      // Filter based on user role
      const userRole = member.role
      if (userRole === 'video_editor') {
        // Video editors should not see draft content, only content waiting for them or in progress
        query = query.neq('status', 'draft')
      } else if (userRole === 'social_media_manager') {
        // Social media managers only see content from 'edited' status and above
        query = query.in('status', ['edited', 'review', 'revision', 'approved', 'scheduled', 'published'])
      }


      
      // Pagination
      const page = filters?.page || 1
      const limit = filters?.limit || 20
      const offset = (page - 1) * limit

      const { data: content, error: contentError, count } = await query
        .range(offset, offset + limit - 1)

      if (contentError) {
        throw new Error(`Failed to get content briefs: ${contentError.message}`)
      }

      return {
        content: content || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    } catch (error) {
      throw error
    }
  }

  // Get single content brief
  static async getContentBrief(contentId: string, userId: string) {
    try {
      const { data: content, error: contentError } = await supabaseAdmin
        .from('content_briefs')
        .select(`
          *,
          workspaces (
            id,
            name
          ),
          created_by_user:created_by (
            id,
            full_name,
            email,
            avatar_url
          ),
          assigned_editor_user:assigned_editor (
            id,
            full_name,
            email,
            avatar_url
          ),
          assigned_manager_user:assigned_manager (
            id,
            full_name,
            email,
            avatar_url
          ),
          content_files (
            id,
            file_url,
            file_name,
            file_type,
            file_size,
            is_editing_material,
            created_at
          ),
          content_comments (
            id,
            comment,
            created_at,
            users (
              id,
              full_name,
              avatar_url
            )
          ),
          content_status_history (
            id,
            old_status,
            new_status,
            feedback,
            created_at,
            users:changed_by (
              id,
              full_name
            )
          )
        `)
        .eq('id', contentId)
        .single()

      if (contentError) {
        throw new Error(`Failed to get content brief: ${contentError.message}`)
      }

      // Verify user has access to this content
      const { data: member, error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', content.workspace_id)
        .eq('user_id', userId)
        .single()

      if (memberError || !member) {
        throw new Error('Access denied: Not a member of this workspace')
      }

      return content
    } catch (error) {
      throw error
    }
  }

  // Update content brief
  static async updateContentBrief(contentId: string, userId: string, updates: Partial<ContentBriefInput>) {
    try {
      // Get current content and verify access
      const { data: currentContent, error: getCurrentError } = await supabaseAdmin
        .from('content_briefs')
        .select('workspace_id, created_by, status')
        .eq('id', contentId)
        .single()

      if (getCurrentError) {
        throw new Error(`Content not found: ${getCurrentError.message}`)
      }

      // Verify user is member of workspace and has permission to edit
      const { data: member, error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', currentContent.workspace_id)
        .eq('user_id', userId)
        .single()

      if (memberError || !member) {
        throw new Error('Access denied: Not a member of this workspace')
      }

      // Only creator or owner can edit basic content (title, script, caption)
      if (currentContent.created_by !== userId && member.role !== 'owner') {
        // Non-creators can only update assignments
        const allowedUpdates = ['assignedEditor', 'assignedManager']
        const hasUnallowedUpdates = Object.keys(updates).some(key => !allowedUpdates.includes(key))
        
        if (hasUnallowedUpdates) {
          throw new Error('Access denied: Only content creator or workspace owner can edit content details')
        }
      }

      const { data: content, error: updateError } = await supabaseAdmin
        .from('content_briefs')
        .update({
          title: updates.title,
          script: updates.script,
          caption: updates.caption,
          note: updates.note,
          label: updates.label,
          assigned_editor: updates.assignedEditor,
          assigned_manager: updates.assignedManager,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to update content brief: ${updateError.message}`)
      }

      return content
    } catch (error) {
      throw error
    }
  }

  // Add files to content brief
  static async addFilesToContent(contentId: string, userId: string, files: Array<{
    fileName: string
    fileUrl: string
    fileSize: number
    fileType: string
    isEditingMaterial: boolean
  }>) {
    try {
      // Verify user has access to content
      const { data: content, error: contentError } = await supabaseAdmin
        .from('content_briefs')
        .select('workspace_id')
        .eq('id', contentId)
        .single()

      if (contentError || !content) {
        throw new Error('Content not found')
      }

      // Verify user is member of workspace
      const { data: member, error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', content.workspace_id)
        .eq('user_id', userId)
        .single()

      if (memberError || !member) {
        throw new Error('Access denied: Not a member of this workspace')
      }

      // Insert files
      const { data: insertedFiles, error: insertError } = await supabaseAdmin
        .from('content_files')
        .insert(
          files.map(file => ({
            content_id: contentId,
            file_name: file.fileName,
            file_url: file.fileUrl,
            file_type: file.fileType,
            file_size: file.fileSize,
            is_editing_material: file.isEditingMaterial
          }))
        )
        .select()

      if (insertError) {
        throw new Error(`Failed to add files: ${insertError.message}`)
      }

      return insertedFiles
    } catch (error) {
      throw error
    }
  }

  // Update content status (for workflow)
  static async updateContentStatus(contentId: string, userId: string, data: UpdateContentStatusInput) {
    try {
      // Get current content and verify access
      const { data: currentContent, error: getCurrentError } = await supabaseAdmin
        .from('content_briefs')
        .select(`
          workspace_id,
          created_by,
          assigned_editor,
          assigned_manager,
          status
        `)
        .eq('id', contentId)
        .single()

      if (getCurrentError) {
        throw new Error(`Content not found: ${getCurrentError.message}`)
      }

      // Verify user is member of workspace
      const { data: member, error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', currentContent.workspace_id)
        .eq('user_id', userId)
        .single()

      if (memberError || !member) {
        throw new Error('Access denied: Not a member of this workspace')
      }

      // Validate status transition permissions
      const canUpdateStatus = this.validateStatusTransition(
        currentContent.status as any,
        data.status,
        userId,
        member.role,
        currentContent
      )

      if (!canUpdateStatus.allowed) {
        throw new Error(canUpdateStatus.reason)
      }

      // Update content status
      const { data: content, error: updateError } = await supabaseAdmin
        .from('content_briefs')
        .update({
          status: data.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to update content status: ${updateError.message}`)
      }

      // Add comment if feedback provided
      if (data.feedback) {
        await supabaseAdmin
          .from('content_comments')
          .insert({
            content_id: contentId,
            user_id: userId,
            comment: data.feedback
          })
      }

      return content
    } catch (error) {
      throw error
    }
  }

  // Validate status transition based on user role and current status
  private static validateStatusTransition(
    currentStatus: string,
    newStatus: string,
    userId: string,
    userRole: string,
    contentData: any
  ): { allowed: boolean; reason?: string } {
    // Owner can do anything
    if (userRole === 'owner') {
      return { allowed: true }
    }

    // Content creator can move from draft to waiting_for_editor
    if (contentData.created_by === userId && currentStatus === 'draft' && newStatus === 'waiting_for_editor') {
      return { allowed: true }
    }

    // Video editor can move from waiting_for_editor to edited
    if (userRole === 'video_editor' && currentStatus === 'waiting_for_editor' && newStatus === 'edited') {
      return { allowed: true }
    }

    // Video editor can move back to waiting_for_editor from revision
    if (userRole === 'video_editor' && currentStatus === 'revision' && newStatus === 'edited') {
      return { allowed: true }
    }

    // Assigned manager can move from edited to review, approved, or revision
    if (contentData.assigned_manager === userId && currentStatus === 'edited' && ['review', 'approved', 'revision'].includes(newStatus)) {
      return { allowed: true }
    }

    // Assigned manager can move from review to approved or revision
    if (contentData.assigned_manager === userId && currentStatus === 'review' && ['approved', 'revision'].includes(newStatus)) {
      return { allowed: true }
    }

    // Social media manager can approve/revise edited content and schedule approved content
    if (userRole === 'social_media_manager' && currentStatus === 'edited' && ['review', 'approved', 'revision'].includes(newStatus)) {
      return { allowed: true }
    }

    // Social media manager can approve/revise content in review
    if (userRole === 'social_media_manager' && currentStatus === 'review' && ['approved', 'revision'].includes(newStatus)) {
      return { allowed: true }
    }

    // Social media manager can schedule approved content
    if (userRole === 'social_media_manager' && currentStatus === 'approved' && ['scheduled', 'published'].includes(newStatus)) {
      return { allowed: true }
    }

    return { 
      allowed: false, 
      reason: `Cannot transition from ${currentStatus} to ${newStatus} with role ${userRole}` 
    }
  }

  // Add comment to content
  static async addComment(contentId: string, userId: string, comment: string) {
    try {
      // Verify user has access to content
      const content = await this.getContentBrief(contentId, userId)

      const { data: newComment, error } = await supabaseAdmin
        .from('content_comments')
        .insert({
          content_id: contentId,
          user_id: userId,
          comment
        })
        .select(`
          *,
          users (
            id,
            full_name,
            avatar_url
          )
        `)
        .single()

      if (error) {
        throw new Error(`Failed to add comment: ${error.message}`)
      }

      return newComment
    } catch (error) {
      throw error
    }
  }

  // Add comment to content brief
  static async addContentComment(contentId: string, workspaceId: string, userId: string, comment: string) {
    try {
      // Verify user is member of workspace
      const { data: member, error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single()

      if (memberError || !member) {
        throw new Error('Access denied: Not a member of this workspace')
      }

      // Verify content exists in workspace
      const { data: content, error: contentError } = await supabaseAdmin
        .from('content_briefs')
        .select('id')
        .eq('id', contentId)
        .eq('workspace_id', workspaceId)
        .single()

      if (contentError) {
        throw new Error('Content not found or access denied')
      }

      // Add comment
      const { data: newComment, error: commentError } = await supabaseAdmin
        .from('content_comments')
        .insert({
          content_id: contentId,
          user_id: userId,
          comment: comment
        })
        .select(`
          *,
          users (
            id,
            full_name,
            avatar_url
          )
        `)
        .single()

      if (commentError) {
        throw new Error(`Failed to add comment: ${commentError.message}`)
      }

      return newComment
    } catch (error) {
      throw error
    }
  }

  // Get comments for content brief
  static async getContentComments(contentId: string, workspaceId: string, userId: string) {
    try {
      // Verify user is member of workspace
      const { data: member, error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single()

      if (memberError || !member) {
        throw new Error('Access denied: Not a member of this workspace')
      }

      // Verify content exists in workspace
      const { data: content, error: contentError } = await supabaseAdmin
        .from('content_briefs')
        .select('id')
        .eq('id', contentId)
        .eq('workspace_id', workspaceId)
        .single()

      if (contentError) {
        throw new Error('Content not found or access denied')
      }

      // Get comments
      const { data: comments, error: commentsError } = await supabaseAdmin
        .from('content_comments')
        .select(`
          *,
          users (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('content_id', contentId)
        .order('created_at', { ascending: true })

      if (commentsError) {
        throw new Error(`Failed to get comments: ${commentsError.message}`)
      }

      return comments
    } catch (error) {
      throw error
    }
  }

  // Get dashboard statistics
  static async getDashboardStats(workspaceId: string, userId: string) {
    try {
      // Verify user is member of workspace
      const { data: member, error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single()

      if (memberError || !member) {
        throw new Error('Access denied: Not a member of this workspace')
      }

      // Get content statistics
      const { data: stats, error: statsError } = await supabaseAdmin
        .from('content_briefs')
        .select('status')
        .eq('workspace_id', workspaceId)

      if (statsError) {
        throw new Error(`Failed to get statistics: ${statsError.message}`)
      }

      const statusCounts = stats.reduce((acc, content) => {
        acc[content.status] = (acc[content.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        totalContent: stats.length,
        publishedContent: (statusCounts.published || 0),
        editingContent: (statusCounts.waiting_for_editor || 0) + (statusCounts.edited || 0) + (statusCounts.review || 0) + (statusCounts.revision || 0),
        scheduledContent: (statusCounts.scheduled || 0),
        approvedContent: (statusCounts.approved || 0),
        draftContent: (statusCounts.draft || 0)
      }
    } catch (error) {
      throw error
    }
  }

  // Delete content brief and associated files
  static async deleteContentBrief(contentId: string, userId: string) {
    try {
      // First, get content details to verify access and get file info
      const { data: content, error: contentError } = await supabaseAdmin
        .from('content_briefs')
        .select(`
          *,
          workspace_id,
          content_files (
            id,
            file_url,
            file_name
          )
        `)
        .eq('id', contentId)
        .single()

      if (contentError || !content) {
        throw new Error('Content brief not found')
      }

      // Verify user has access to this workspace
      const { data: member, error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', content.workspace_id)
        .eq('user_id', userId)
        .single()

      if (memberError || !member) {
        throw new Error('Access denied: Not a member of this workspace')
      }

      // Only allow deletion by content creator, workspace owner, or manager
      const isCreator = content.created_by === userId
      const isOwnerOrManager = ['owner', 'social_media_manager'].includes(member.role)
      
      if (!isCreator && !isOwnerOrManager) {
        throw new Error('Access denied: Only content creator, workspace owner, or managers can delete content')
      }

      // Delete physical files from disk
      const fs = require('fs').promises
      const path = require('path')
      
      if (content.content_files && content.content_files.length > 0) {
        for (const file of content.content_files) {
          try {
            // Construct file path
            const filePath = path.join(process.cwd(), 'public', file.file_url)
            
            // Check if file exists and delete it
            await fs.access(filePath)
            await fs.unlink(filePath)
            console.log(`Deleted file: ${filePath}`)
          } catch (fileError) {
            console.warn(`Failed to delete file ${file.file_url}:`, fileError)
            // Continue with deletion even if some files can't be deleted
          }
        }

        // Try to remove the content directory if it's empty
        try {
          const contentDir = path.join(process.cwd(), 'public', 'uploads', content.workspace_id, contentId)
          await fs.rmdir(contentDir)
          console.log(`Deleted content directory: ${contentDir}`)
          
          // Also try to remove workspace directory if it's empty
          try {
            const workspaceDir = path.join(process.cwd(), 'public', 'uploads', content.workspace_id)
            await fs.rmdir(workspaceDir)
            console.log(`Deleted workspace directory: ${workspaceDir}`)
          } catch (workspaceDirError: any) {
            // It's normal if workspace directory is not empty
            console.log(`Workspace directory not empty (normal): ${workspaceDirError.message}`)
          }
        } catch (dirError) {
          console.warn(`Failed to delete directory for content ${contentId}:`, dirError)
        }
      }

      // Delete file records from database
      const { error: filesDeleteError } = await supabaseAdmin
        .from('content_files')
        .delete()
        .eq('content_id', contentId)

      if (filesDeleteError) {
        console.warn('Failed to delete file records:', filesDeleteError)
        // Continue with content deletion even if file records deletion fails
      }

      // Delete comments
      const { error: commentsDeleteError } = await supabaseAdmin
        .from('content_comments')
        .delete()
        .eq('content_id', contentId)

      if (commentsDeleteError) {
        console.warn('Failed to delete comments:', commentsDeleteError)
        // Continue with content deletion
      }

      // Finally, delete the content brief
      const { error: deleteError } = await supabaseAdmin
        .from('content_briefs')
        .delete()
        .eq('id', contentId)

      if (deleteError) {
        throw new Error(`Failed to delete content brief: ${deleteError.message}`)
      }

      return { success: true, message: 'Content brief and associated files deleted successfully' }
    } catch (error) {
      throw error
    }
  }
}