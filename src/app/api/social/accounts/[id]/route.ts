import { NextRequest, NextResponse } from 'next/server'
import { SocialMediaService } from '@/backend/services/socialMediaService'

interface RouteParams {
  params: {
    id: string
  }
}

// Disconnect social media account
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    await SocialMediaService.disconnectSocialAccount(params.id)

    return NextResponse.json({
      success: true,
      message: 'Social media account disconnected successfully'
    })

  } catch (error: any) {
    console.error('Disconnect social account error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to disconnect social account' },
      { status: 500 }
    )
  }
}