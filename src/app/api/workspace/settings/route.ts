import { NextRequest, NextResponse } from 'next/server'
import { WorkspaceService } from '@/backend/services/workspaceService'
import { workspaceSchema } from '@/backend/utils/validation'

export async function PATCH(request: NextRequest) {
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
    const validatedData = workspaceSchema.parse(body)

    const updatedWorkspace = await WorkspaceService.updateWorkspace(workspaceId, userId, validatedData)

    return NextResponse.json({
      success: true,
      data: updatedWorkspace,
      message: 'Workspace updated successfully'
    })
  } catch (error: any) {
    console.error('Update workspace error:', error)
    
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
      { 
        success: false, 
        error: error.message || 'Failed to update workspace' 
      },
      { status: 500 }
    )
  }
}