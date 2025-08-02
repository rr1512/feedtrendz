import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './backend/utils/jwt'

const PUBLIC_ROUTES = ['/login', '/register', '/']
const AUTH_ROUTES = ['/login', '/register']
const ADMIN_ROUTES = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get token from cookies
  const token = request.cookies.get('auth-token')?.value
  
  // Verify token
  let user = null
  if (token) {
    user = await verifyToken(token)
  }
  
  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    if (!user || user.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }
  
  // Handle API routes
  if (pathname.startsWith('/api/')) {
    // Public API routes
    if (
      pathname === '/api/auth/login' ||
      pathname === '/api/auth/register' ||
      pathname === '/api/auth/logout' ||
      pathname === '/api/health' ||
      pathname === '/api/test-db' ||
      pathname.startsWith('/api/setup/') ||
      pathname.startsWith('/api/files/public/') // Allow public file access for social media
    ) {
      return NextResponse.next()
    }
    
    // Protected API routes
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.userId)
    requestHeaders.set('x-user-email', user.email)
    if (user.workspaceId) {
      requestHeaders.set('x-workspace-id', user.workspaceId)
    }
    if (user.role) {
      requestHeaders.set('x-user-role', user.role)
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  // Handle page routes
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  const isAuthRoute = AUTH_ROUTES.includes(pathname)
  
  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Redirect unauthenticated users to login
  if (!isPublicRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}