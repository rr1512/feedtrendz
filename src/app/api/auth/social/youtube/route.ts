import { NextRequest, NextResponse } from 'next/server'
import { SocialAuthUtils } from '@/backend/utils/socialAuth'

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.headers.get('x-workspace-id')
    
    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    // Generate state parameter for security
    const state = `${workspaceId}:${Date.now()}:${Math.random().toString(36).substring(2)}`
    
    // Generate OAuth URL
    const authUrl = SocialAuthUtils.generateAuthUrl('youtube', state)
    
    return NextResponse.json({
      success: true,
      data: {
        authUrl: authUrl,
        state: state
      }
    })

  } catch (error: any) {
    console.error('YouTube OAuth URL generation error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate OAuth URL' },
      { status: 500 }
    )
  }
}