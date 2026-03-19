import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/owner/expiring-members
 *
 * Returns members whose subscription plans will expire within the next
 * seven days. Only accessible by the owner. Each entry includes the
 * member's name, plan type, and expiry date.
 */
export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const role = (session.user as any).role as string
  if (role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const now = new Date()
    const in7days = new Date(now)
    in7days.setDate(now.getDate() + 7)
    const members = await prisma.member.findMany({
      where: {
        planExpiry: { gte: now, lte: in7days }
      },
      include: { user: true }
    })
    const result = members.map(m => ({
      id: m.id,
      name: m.user?.name,
      plan: m.plan,
      expiry: m.planExpiry,
      planStatus: m.planStatus
    }))
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}