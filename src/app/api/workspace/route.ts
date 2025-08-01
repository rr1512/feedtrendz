import { NextRequest, NextResponse } from 'next/server'
import { WorkspaceService } from '@/backend/services/workspaceService'
import { workspaceSchema } from '@/backend/utils/validation'

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
    console.error('Get workspaces error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get workspaces' },
      { status: 400 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing user ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = workspaceSchema.parse(body)

    const workspace = await WorkspaceService.createWorkspace(userId, validatedData)

    return NextResponse.json({
      success: true,
      data: workspace
    })
  } catch (error: any) {
    console.error('Create workspace error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.errors 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create workspace' },
      { status: 400 }
    )
  }
} 