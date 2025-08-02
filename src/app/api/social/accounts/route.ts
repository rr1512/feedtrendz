import { NextRequest, NextResponse } from 'next/server'
import { SocialMediaService } from '@/backend/services/socialMediaService'

// Get all social media accounts for workspace
export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.headers.get('x-workspace-id')
    
    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    const accounts = await SocialMediaService.getWorkspaceSocialAccounts(workspaceId)
    
    // Remove sensitive data before sending to client
    const safeAccounts = accounts.map(account => ({
      id: account.id,
      platform: account.platform,
      account_name: account.account_name,
      is_active: account.is_active,
      created_at: account.created_at,
      updated_at: account.updated_at,
      expires_at: account.expires_at,
      // Add computed status
      status: account.expires_at && new Date(account.expires_at) < new Date() 
        ? 'expired' 
        : account.is_active 
          ? 'connected' 
          : 'disconnected'
    }))

    return NextResponse.json({
      success: true,
      data: safeAccounts
    })

  } catch (error: any) {
    console.error('Get social accounts error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get social accounts' },
      { status: 500 }
    )
  }
}