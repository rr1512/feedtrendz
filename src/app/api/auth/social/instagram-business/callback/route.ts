import { NextRequest, NextResponse } from 'next/server'
import { InstagramBusinessAuth } from '@/backend/utils/instagramBusinessAuth'
import { SocialMediaService } from '@/backend/services/socialMediaService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth error
    if (error) {
      let errorDescription = searchParams.get('error_description') || 'OAuth authentication failed'
      
      // Handle specific Instagram errors
      if (error === 'access_denied' || errorDescription.includes('Insufficient Developer Role')) {
        errorDescription = 'Instagram Developer Error: This app is in Development Mode. Please ensure your Instagram account is added as an Instagram Tester in the Facebook App settings, or submit the app for Instagram Review for production use.'
      }
      
      console.error('Instagram OAuth error:', { error, errorDescription })
      
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/social?error=${encodeURIComponent(errorDescription)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/social?error=Missing authorization code or state`
      )
    }

    // Parse state to get workspace ID (format: workspaceId:platform:timestamp:random)
    const stateParts = state.split(':')
    const workspaceId = stateParts[0]
    const platform = stateParts[1]
    
    if (!workspaceId || platform !== 'instagram_business') {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/social?error=Invalid state parameter`
      )
    }

    // Exchange code for access token
    console.log('Exchanging Instagram Business code for token...')
    const tokenData = await InstagramBusinessAuth.exchangeCodeForToken(code)
    
    // Get Instagram Business Account info
    console.log('Getting Instagram Business Account info...')
    const businessAccount = await InstagramBusinessAuth.getBusinessAccount(tokenData.access_token)
    
    console.log('Instagram Business Account connected:', {
      id: businessAccount.id,
      username: businessAccount.username,
      account_type: businessAccount.account_type,
      followers_count: businessAccount.followers_count,
      media_count: businessAccount.media_count
    })

    // Calculate token expiry (60 days for long-lived tokens)
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days default

    // Save Instagram Business Account
    await SocialMediaService.connectSocialAccount(workspaceId, {
      platform: 'instagram', // Keep as 'instagram' for consistency, but this uses Business API
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      account_name: `@${businessAccount.username}${businessAccount.name ? ` (${businessAccount.name})` : ''}`,
      account_id: businessAccount.id // Store Instagram Business Account ID directly
    })

    // Redirect back to social page with success
    const message = `Instagram Business Account @${businessAccount.username} connected successfully`
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/social?success=${encodeURIComponent(message)}`
    )

  } catch (error: any) {
    console.error('Instagram Business OAuth callback error:', error)
    
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/social?error=${encodeURIComponent(error.message || 'Failed to connect Instagram Business account')}`
    )
  }
}