import { supabaseAdmin } from '../config/database'
import type { WorkspaceInput, InviteUserInput } from '../utils/validation'

export class WorkspaceService {
  // Create new workspace
  static async createWorkspace(ownerId: string, data: WorkspaceInput) {
    try {
      const { data: workspace, error: workspaceError } = await supabaseAdmin
        .from('workspaces')
        .insert({
          name: data.name,
          owner_id: ownerId
        })
        .select()
        .single()

      if (workspaceError) {
        throw new Error(`Failed to create workspace: ${workspaceError.message}`)
      }

      // Add owner as member
      const { error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: ownerId,
          role: 'owner'
        })

      if (memberError) {
        throw new Error(`Failed to add owner to workspace: ${memberError.message}`)
      }

      return workspace
    } catch (error) {
      throw error
    }
  }

  // Get workspace details
  static async getWorkspace(workspaceId: string, userId: string) {
    try {
      // Check if user is member of workspace
      const { data: member, error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single()

      if (memberError || !member) {
        throw new Error('Access denied: Not a member of this workspace')
      }

      // Get workspace details
      const { data: workspace, error: workspaceError } = await supabaseAdmin
        .from('workspaces')
        .select(`
          id,
          name,
          created_at,
          updated_at,
          users:owner_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('id', workspaceId)
        .single()

      if (workspaceError) {
        throw new Error(`Failed to get workspace: ${workspaceError.message}`)
      }

      // Get workspace members
      const { data: members, error: membersError } = await supabaseAdmin
        .from('workspace_members')
        .select(`
          role,
          created_at,
          users (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('workspace_id', workspaceId)

      if (membersError) {
        throw new Error(`Failed to get workspace members: ${membersError.message}`)
      }

      return {
        ...workspace,
        userRole: member.role,
        members: members.map(m => ({
          user: m.users,
          role: m.role,
          joinedAt: m.created_at
        }))
      }
    } catch (error) {
      throw error
    }
  }

  // Get workspace members
  static async getWorkspaceMembers(workspaceId: string, userId: string) {
    try {
      // Check if user is member of workspace
      const { data: member, error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single()

      if (memberError || !member) {
        throw new Error('Access denied: Not a member of this workspace')
      }

      // Get workspace members
      const { data: members, error: membersError } = await supabaseAdmin
        .from('workspace_members')
        .select(`
          role,
          created_at,
          users (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('workspace_id', workspaceId)

      if (membersError) {
        throw new Error(`Failed to get workspace members: ${membersError.message}`)
      }

      return members.map(m => ({
        user: {
          id: m.users.id,
          email: m.users.email,
          fullName: m.users.full_name,
          avatarUrl: m.users.avatar_url
        },
        role: m.role,
        joinedAt: m.created_at
      }))
    } catch (error) {
      throw error
    }
  }

  // Update workspace
  static async updateWorkspace(workspaceId: string, userId: string, data: WorkspaceInput) {
    try {
      // Check if user is owner
      const { data: member, error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single()

      if (memberError || !member || member.role !== 'owner') {
        throw new Error('Access denied: Only workspace owner can update workspace')
      }

      const { data: workspace, error } = await supabaseAdmin
        .from('workspaces')
        .update({
          name: data.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspaceId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update workspace: ${error.message}`)
      }

      return workspace
    } catch (error) {
      throw error
    }
  }

  // Invite user to workspace
  static async inviteUser(workspaceId: string, inviterId: string, data: InviteUserInput) {
    try {
      // Check if inviter is owner or has permission
      const { data: inviterMember, error: inviterError } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', inviterId)
        .single()

      if (inviterError || !inviterMember || inviterMember.role !== 'owner') {
        throw new Error('Access denied: Only workspace owner can invite users')
      }

      // Check if user exists
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name')
        .eq('email', data.email)
        .single()

      if (userError || !user) {
        throw new Error('User not found with this email')
      }

      // Check if user is already a member
      const { data: existingMember } = await supabaseAdmin
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        throw new Error('User is already a member of this workspace')
      }

      // Add user to workspace
      const { data: newMember, error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          role: data.role
        })
        .select(`
          role,
          created_at,
          users (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .single()

      if (memberError) {
        throw new Error(`Failed to add user to workspace: ${memberError.message}`)
      }

      // Create notification for invited user
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: user.id,
          workspace_id: workspaceId,
          title: 'Workspace Invitation',
          message: `You have been invited to join workspace as ${data.role.replace('_', ' ')}. You can now access all content in this workspace.`,
          type: 'info'
        })

      return {
        user: newMember.users,
        role: newMember.role,
        joinedAt: newMember.created_at
      }
    } catch (error) {
      throw error
    }
  }

  // Remove user from workspace
  static async removeUser(workspaceId: string, ownerId: string, userId: string) {
    try {
      // Check if requester is owner
      const { data: ownerMember, error: ownerError } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', ownerId)
        .single()

      if (ownerError || !ownerMember || ownerMember.role !== 'owner') {
        throw new Error('Access denied: Only workspace owner can remove users')
      }

      // Cannot remove owner
      if (userId === ownerId) {
        throw new Error('Cannot remove workspace owner')
      }

      const { error } = await supabaseAdmin
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)

      if (error) {
        throw new Error(`Failed to remove user from workspace: ${error.message}`)
      }

      return { success: true }
    } catch (error) {
      throw error
    }
  }

  // Get user workspaces
  static async getUserWorkspaces(userId: string) {
    try {
      const { data: memberships, error } = await supabaseAdmin
        .from('workspace_members')
        .select(`
          role,
          workspaces (
            id,
            name,
            created_at,
            users:owner_id (
              full_name,
              email
            )
          )
        `)
        .eq('user_id', userId)

      if (error) {
        throw new Error(`Failed to get user workspaces: ${error.message}`)
      }

      return memberships.map(membership => ({
        workspace: membership.workspaces,
        role: membership.role
      }))
    } catch (error) {
      throw error
    }
  }

  // Update user role in workspace
  static async updateUserRole(workspaceId: string, ownerId: string, userId: string, newRole: string) {
    try {
      // Check if requester is owner
      const { data: ownerMember, error: ownerError } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', ownerId)
        .single()

      if (ownerError || !ownerMember || ownerMember.role !== 'owner') {
        throw new Error('Access denied: Only workspace owner can update user roles')
      }

      // Cannot change owner role
      if (userId === ownerId) {
        throw new Error('Cannot change workspace owner role')
      }

      const { data: member, error } = await supabaseAdmin
        .from('workspace_members')
        .update({
          role: newRole as any
        })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .select(`
          role,
          users (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .single()

      if (error) {
        throw new Error(`Failed to update user role: ${error.message}`)
      }

      return {
        user: member.users,
        role: member.role
      }
    } catch (error) {
      throw error
    }
  }
}