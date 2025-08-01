import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/backend/services/userService'
import { loginSchema } from '@/backend/utils/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = loginSchema.parse(body)
    
    // Login user
    const result = await UserService.login(validatedData)
    
    // Set auth cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: result.user,
        workspace: result.workspace
      }
    })
    
    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    return response
    
  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.errors 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Login failed' 
      },
      { status: 401 }
    )
  }
}