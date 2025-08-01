import { supabaseAdmin } from '../config/database'
import { hashPassword, verifyPassword } from '../utils/password'
import { generateToken } from '../utils/jwt'
import type { RegisterInput, LoginInput } from '../utils/validation'

export class UserService {
  // Register new user and create default workspace
  static async register(data: RegisterInput) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', data.email)
        .single()

      if (existingUser) {
        throw new Error('User already exists with this email')
      }

      // Hash password
      const hashedPassword = await hashPassword(data.password)

      // Create user
      const { data: newUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          email: data.email,
          password_hash: hashedPassword,
          full_name: data.fullName
        })
        .select()
        .single()

      if (userError) {
        throw new Error(`Failed to create user: ${userError.message}`)
      }

      // Create default workspace
      const { data: workspace, error: workspaceError } = await supabaseAdmin
        .from('workspaces')
        .insert({
          name: 'My Workspace',
          owner_id: newUser.id
        })
        .select()
        .single()

      if (workspaceError) {
        throw new Error(`Failed to create workspace: ${workspaceError.message}`)
      }

      // Add user as owner to workspace
      const { error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: newUser.id,
          role: 'owner'
        })

      if (memberError) {
        throw new Error(`Failed to add user to workspace: ${memberError.message}`)
      }

      // Generate JWT token
      const token = await generateToken({
        userId: newUser.id,
        email: newUser.email,
        workspaceId: workspace.id,
        role: 'owner'
      })

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.full_name,
          avatarUrl: newUser.avatar_url
        },
        workspace: {
          id: workspace.id,
          name: workspace.name
        },
        token
      }
    } catch (error) {
      throw error
    }
  }

  // Login user
  static async login(data: LoginInput) {
    try {
      // Get user by email
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', data.email)
        .single()

      if (userError || !user) {
        throw new Error('Invalid email or password')
      }

      // Verify password
      const isValidPassword = await verifyPassword(data.password, user.password_hash)
      
      if (!isValidPassword) {
        throw new Error('Invalid email or password')
      }

      // Get user's first workspace (either owned or member)
      const { data: userWorkspaces } = await supabaseAdmin
        .from('workspace_members')
        .select(`
          role,
          workspaces (
            id,
            name,
            owner_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      const workspace = userWorkspaces?.workspaces
      const userRole = userWorkspaces?.role

      // Generate JWT token
      const token = await generateToken({
        userId: user.id,
        email: user.email,
        workspaceId: workspace?.id,
        role: userRole
      })

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          avatarUrl: user.avatar_url
        },
        workspace: workspace ? {
          id: workspace.id,
          name: workspace.name
        } : null,
        token
      }
    } catch (error) {
      throw error
    }
  }

  // Get user profile
  static async getUserProfile(userId: string) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, avatar_url, created_at')
        .eq('id', userId)
        .single()

      if (error) {
        throw new Error(`Failed to get user profile: ${error.message}`)
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      }
    } catch (error) {
      throw error
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: {
    fullName?: string
    avatarUrl?: string
  }) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update({
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update user profile: ${error.message}`)
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url
      }
    } catch (error) {
      throw error
    }
  }

  // Get users in workspace
  static async getUsersInWorkspace(workspaceId: string) {
    try {
      const { data: members, error } = await supabaseAdmin
        .from('workspace_members')
        .select(`
          role,
          users (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('workspace_id', workspaceId)

      if (error) {
        throw new Error(`Failed to get workspace members: ${error.message}`)
      }

      return members.map(member => ({
        user: member.users,
        role: member.role
      }))
    } catch (error) {
      throw error
    }
  }
}