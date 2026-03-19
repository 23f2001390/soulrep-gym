import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Export handlers for GET and POST methods. NextAuth will handle all requests
// under this route, supporting sign‑in, sign‑out, callback and session APIs.
const handler = NextAuth(authOptions)
export const GET = handler
export const POST = handler