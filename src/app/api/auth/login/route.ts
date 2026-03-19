import { NextResponse } from 'next/server'

/**
 * Handle POST /api/auth/login
 *
 * This endpoint authenticates a user via email/password. On success it
 * returns a JWT token along with basic user and role information. The
 * client should include the token in the Authorization header for
 * subsequent requests (Bearer scheme).
 */
// This legacy login route is no longer used. The application now uses NextAuth for authentication.
// If called, return an error instructing the client to use /api/auth/[...nextauth].
export async function POST(request: Request) {
  return NextResponse.json({ error: 'Please use the NextAuth credentials provider for login.' }, { status: 404 })
}