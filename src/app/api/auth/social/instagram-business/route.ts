import { NextRequest, NextResponse } from 'next/server'
import { InstagramBusinessAuth } from '@/backend/utils/instagramBusinessAuth'

export async function GET(request: NextRequest) {
  try {
    // Get workspace ID from middleware (authentication already handled)
    const workspaceId = request.headers.get('x-workspace-id')
    const userId = request.headers.get('x-user-id')
    
    console.log('Instagram Business OAuth request:', {
      workspaceId,
      userId,
      headers: Object.fromEntries(request.headers.entries())
    })
    
    if (!workspaceId) {
      console.error('Missing workspace ID in headers')
      return NextResponse.json(
        { success: false, error: 'Workspace ID is required. Please make sure you are logged in.' },
        { status: 400 }
      )
    }

    // Generate state parameter for security
    const state = `${workspaceId}:instagram_business:${Date.now()}:${Math.random().toString(36).substring(2)}`
    
    // Check environment variables
    if (!process.env.INSTAGRAM_BUSINESS_CLIENT_ID || !process.env.INSTAGRAM_BUSINESS_CLIENT_SECRET) {
      console.error('Missing Instagram Business environment variables')
      return NextResponse.json(
        { success: false, error: 'Instagram Business API not configured. Please check environment variables.' },
        { status: 500 }
      )
    }

    // Generate Instagram Business OAuth URL
    const authUrl = InstagramBusinessAuth.generateAuthUrl(state)
    
    console.log('Instagram Business OAuth URL generated:', {
      authUrl: authUrl.substring(0, 100) + '...',
      state: state.substring(0, 50) + '...'
    })

    return NextResponse.json({
      success: true,
      data: {
        authUrl: authUrl,
        state: state
      }
    })

  } catch (error: any) {
    console.error('Instagram Business OAuth URL generation error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate OAuth URL' },
      { status: 500 }
    )
  }
}