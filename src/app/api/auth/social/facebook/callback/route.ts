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
    const tokenData = await SocialAuthUtils.exchangeCodeForToken('facebook', code)
    
    // Get user profile
    const userProfile = await SocialAuthUtils.getUserProfile('facebook', tokenData.access_token)
    
    // Get Facebook Pages managed by user
    const facebookPages = await SocialAuthUtils.getFacebookPages(tokenData.access_token)
    
    // Calculate token expiry
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : undefined

    // Save each Facebook Page as a separate social account
    let connectedPages = 0
    for (const page of facebookPages) {
      // Check if page has required permissions
      const hasRequiredTasks = page.tasks && (
        page.tasks.includes('CREATE_CONTENT') || 
        page.tasks.includes('MANAGE')
      )
      
      if (hasRequiredTasks) {
        await SocialMediaService.connectSocialAccount(workspaceId, {
          platform: 'facebook',
          access_token: page.access_token, // Use Page access token
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt,
          account_name: `${page.name} (${page.category})`, // Include category in name
          account_id: page.id // Store Facebook Page ID
        })
        connectedPages++
      }
    }

    // Redirect back to social page with success
    const message = connectedPages > 0 
      ? `${connectedPages} Facebook Page(s) connected successfully`
      : 'Facebook connected, but no Pages with required permissions found'
    
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/social?success=${encodeURIComponent(message)}`
    )

  } catch (error: any) {
    console.error('Facebook OAuth callback error:', error)
    
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/social?error=${encodeURIComponent(error.message || 'Failed to connect Facebook account')}`
    )
  }
}