import { NextRequest, NextResponse } from 'next/server'
import { WorkspaceService } from '@/backend/services/workspaceService'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const workspaceId = request.headers.get('x-workspace-id')
    const userId = request.headers.get('x-user-id')
    
    if (!workspaceId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required headers' },
        { status: 400 }
      )
    }

    await WorkspaceService.removeUser(workspaceId, userId, params.memberId)

    return NextResponse.json({
      success: true,
      message: 'User removed from workspace'
    })
  } catch (error: any) {
    console.error('Remove user error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to remove user' 
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const workspaceId = request.headers.get('x-workspace-id')
    const userId = request.headers.get('x-user-id')
    
    if (!workspaceId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required headers' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { role } = body

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role is required' },
        { status: 400 }
      )
    }

    const validRoles = ['script_writer', 'video_editor', 'social_media_manager']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      )
    }

    const updatedMember = await WorkspaceService.updateUserRole(workspaceId, userId, params.memberId, role)

    return NextResponse.json({
      success: true,
      data: updatedMember,
      message: 'User role updated successfully'
    })
  } catch (error: any) {
    console.error('Update user role error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update user role' 
      },
      { status: 500 }
    )
  }
}