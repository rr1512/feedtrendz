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
    const tokenData = await SocialAuthUtils.exchangeCodeForToken('instagram', code)
    
    // Get Instagram Business Accounts
    const instagramAccounts = await SocialAuthUtils.getInstagramBusinessAccounts(tokenData.access_token)
    
    if (instagramAccounts.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/social?error=${encodeURIComponent('No Instagram Business Account found. Please connect a Facebook Page that has an Instagram Business Account linked.')}`
      )
    }
    
    // Calculate token expiry
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : undefined

    // Save each Instagram Business Account as a separate social account
    let connectedAccounts = 0
    for (const igAccount of instagramAccounts) {
      console.log('Connecting Instagram Account:', {
        id: igAccount.id,
        username: igAccount.username,
        name: igAccount.name,
        page_name: igAccount.page_name,
        followers_count: igAccount.followers_count
      })

      await SocialMediaService.connectSocialAccount(workspaceId, {
        platform: 'instagram',
        access_token: igAccount.page_access_token, // Use Page access token for Instagram
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        account_name: `@${igAccount.username} (${igAccount.name || igAccount.page_name})`,
        account_id: igAccount.id // Store Instagram Business Account ID
      })
      connectedAccounts++
    }

    // Redirect back to social page with success
    const message = `${connectedAccounts} Instagram Business Account(s) connected successfully`
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/social?success=${encodeURIComponent(message)}`
    )

  } catch (error: any) {
    console.error('Instagram OAuth callback error:', error)
    
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/social?error=${encodeURIComponent(error.message || 'Failed to connect Instagram account')}`
    )
  }
}