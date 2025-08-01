import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/backend/services/userService'
import { WorkspaceService } from '@/backend/services/workspaceService'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const workspaceId = request.headers.get('x-workspace-id')
    const userRole = request.headers.get('x-user-role')
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not authenticated' 
        },
        { status: 401 }
      )
    }
    
    // Get user profile
    const user = await UserService.getUserProfile(userId)
    
    let workspace = null
    if (workspaceId) {
      try {
        workspace = await WorkspaceService.getWorkspace(workspaceId, userId)
      } catch (error) {
        // Workspace might not exist or user might not have access
        console.error('Failed to get workspace:', error)
      }
    }
    
    // Get user workspaces
    const workspaces = await WorkspaceService.getUserWorkspaces(userId)
    
    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          role: userRole
        },
        currentWorkspace: workspace,
        workspaces: workspaces
      }
    })
    
  } catch (error: any) {
    console.error('Get user error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get user data' 
      },
      { status: 500 }
    )
  }
}