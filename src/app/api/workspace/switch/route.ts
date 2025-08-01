import { NextRequest, NextResponse } from 'next/server'
import { WorkspaceService } from '@/backend/services/workspaceService'
import { generateToken } from '@/backend/utils/jwt'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const { workspaceId } = await request.json()
    
    if (!userId || !workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Verify user has access to this workspace
    const workspace = await WorkspaceService.getWorkspace(workspaceId, userId)
    
    // Generate new token with updated workspace
    const token = await generateToken({
      userId,
      email: request.headers.get('x-user-email') || '',
      workspaceId,
      role: workspace.userRole
    })

    // Set new auth cookie
    const response = NextResponse.json({
      success: true,
      data: {
        workspace: {
          id: workspace.id,
          name: workspace.name
        },
        userRole: workspace.userRole
      }
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error: any) {
    console.error('Switch workspace error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to switch workspace' },
      { status: 400 }
    )
  }
} 