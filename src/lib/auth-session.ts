import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

/**
 * Helper to retrieve the current authenticated session on the server. It wraps
 * NextAuth's getServerSession with the application's authOptions. Use this
 * helper in API routes to enforce authentication and retrieve the user's
 * id and role. It returns null if no session exists.
 */
export async function getAuthSession() {
  const session = await getServerSession(authOptions)
  return session
}