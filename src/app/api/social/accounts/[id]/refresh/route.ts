import { NextRequest, NextResponse } from 'next/server'
import { SocialMediaService } from '@/backend/services/socialMediaService'
import { SocialAuthUtils } from '@/backend/utils/socialAuth'

interface RouteParams {
  params: {
    id: string
  }
}

// Refresh access token for social media account
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get account details
    const account = await SocialMediaService.getSocialAccountById(params.id)
    
    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Social account not found' },
        { status: 404 }
      )
    }

    if (!account.refresh_token) {
      return NextResponse.json(
        { success: false, error: 'No refresh token available for this account' },
        { status: 400 }
      )
    }

    // Refresh the token
    const newTokenData = await SocialAuthUtils.refreshAccessToken(
      account.platform, 
      account.refresh_token
    )

    // Calculate new expiry
    const expiresAt = newTokenData.expires_in 
      ? new Date(Date.now() + newTokenData.expires_in * 1000).toISOString()
      : undefined

    // Update in database
    await SocialMediaService.refreshAccessToken(
      params.id, 
      newTokenData.access_token, 
      expiresAt
    )

    return NextResponse.json({
      success: true,
      message: 'Access token refreshed successfully'
    })

  } catch (error: any) {
    console.error('Refresh token error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to refresh access token' },
      { status: 500 }
    )
  }
}