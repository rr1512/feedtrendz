import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
    
    // Remove auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    })
    
    return response
    
  } catch (error: any) {
    console.error('Logout error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Logout failed' 
      },
      { status: 500 }
    )
  }
}