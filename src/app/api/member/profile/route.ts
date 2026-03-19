import { NextResponse, NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/member/profile
 *
 * Returns the authenticated member's profile. This includes basic user
 * information as well as the associated Member record with plan and other
 * details. Requires a valid session via NextAuth.
 */
export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = (session.user as any).id as string
  const role = (session.user as any).role as string
  if (role !== 'MEMBER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { Member: true }
    })
    if (!user || !user.Member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      member: user.Member
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}