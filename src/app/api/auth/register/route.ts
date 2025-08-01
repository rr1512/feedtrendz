import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/backend/services/userService'
import { registerSchema } from '@/backend/utils/validation'
import { setAuthCookie } from '@/backend/utils/jwt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    
    // Register user
    const result = await UserService.register(validatedData)
    
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
    console.error('Registration error:', error)
    
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
        error: error.message || 'Registration failed' 
      },
      { status: 400 }
    )
  }
}