import { NextResponse, NextRequest } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getMemberProfile } from '@/backend/services/member.service'

/**
 * GET /api/member/profile
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['MEMBER'])
  if (auth.error) return auth.error


  try {
    const { data, error, status } = await getMemberProfile(auth.user.id)
    if (error) {
      return NextResponse.json({ error }, { status })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}