import { NextRequest, NextResponse } from 'next/server'
import { SocialAuthUtils } from '@/backend/utils/socialAuth'
import { SocialMediaService } from '@/backend/services/socialMediaService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth error
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'OAuth authentication failed'
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/social?error=${encodeURIComponent(errorDescription)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/social?error=Missing authorization code or state`
      )
    }

    // Parse state to get workspace ID
    const [workspaceId] = state.split(':')
    if (!workspaceId) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/social?error=Invalid state parameter`
      )
    }

    // Exchange code for access token
    const tokenData = await SocialAuthUtils.exchangeCodeForToken('youtube', code)
    
    // Get user profile
    const userProfile = await SocialAuthUtils.getUserProfile('youtube', tokenData.access_token)
    
    // Calculate token expiry
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : undefined

    // Save to database
    await SocialMediaService.connectSocialAccount(workspaceId, {
      platform: 'youtube',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      account_name: userProfile.name,
      account_id: userProfile.id
    })

    // Redirect back to social page with success
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/social?success=YouTube account connected successfully`
    )

  } catch (error: any) {
    console.error('YouTube OAuth callback error:', error)
    
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/social?error=${encodeURIComponent(error.message || 'Failed to connect YouTube account')}`
    )
  }
}