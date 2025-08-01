import { NextRequest, NextResponse } from 'next/server'
import { WorkspaceService } from '@/backend/services/workspaceService'

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.headers.get('x-workspace-id')
    const userId = request.headers.get('x-user-id')
    
    if (!workspaceId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required headers' },
        { status: 400 }
      )
    }

    const members = await WorkspaceService.getWorkspaceMembers(workspaceId, userId)

    return NextResponse.json({
      success: true,
      data: members
    })
  } catch (error: any) {
    console.error('Get workspace members error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get workspace members' 
      },
      { status: 500 }
    )
  }
}