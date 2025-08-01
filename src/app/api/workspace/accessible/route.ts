import { NextRequest, NextResponse } from 'next/server'
import { WorkspaceService } from '@/backend/services/workspaceService'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing user ID' },
        { status: 400 }
      )
    }

    const workspaces = await WorkspaceService.getUserWorkspaces(userId)

    return NextResponse.json({
      success: true,
      data: workspaces
    })
  } catch (error: any) {
    console.error('Get accessible workspaces error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get accessible workspaces' },
      { status: 400 }
    )
  }
} 