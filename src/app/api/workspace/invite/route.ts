import { NextRequest, NextResponse } from 'next/server'
import { WorkspaceService } from '@/backend/services/workspaceService'
import { inviteUserSchema } from '@/backend/utils/validation'

export async function POST(request: NextRequest) {
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
    const validatedData = inviteUserSchema.parse(body)

    const newMember = await WorkspaceService.inviteUser(workspaceId, userId, validatedData)

    return NextResponse.json({
      success: true,
      data: newMember,
      message: `User ${validatedData.email} has been invited to the workspace`
    })
  } catch (error: any) {
    console.error('Invite user error:', error)
    
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
        error: error.message || 'Failed to invite user' 
      },
      { status: 500 }
    )
  }
}