import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-minimum-32-characters')
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  workspaceId?: string
  role?: string
  iat?: number
  exp?: number
}

export async function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export function getTokenFromRequest(): string | null {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')
    return token?.value || null
  } catch (error) {
    return null
  }
}

export function setAuthCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
}

export function removeAuthCookie() {
  const cookieStore = cookies()
  cookieStore.delete('auth-token')
}