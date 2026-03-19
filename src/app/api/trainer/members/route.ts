import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/trainer/members
 *
 * Returns a list of members assigned to the authenticated trainer.
 * Each member includes basic information and their current plan status.
 */
export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = (session.user as any).id as string
  const role = (session.user as any).role as string
  if (role !== 'TRAINER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const members = await prisma.member.findMany({
      where: { trainerId: id },
      include: { user: true }
    })
    const result = members.map(m => ({
      id: m.id,
      name: m.user?.name,
      email: m.user?.email,
      phone: m.user?.phone,
      plan: m.plan,
      planStatus: m.planStatus,
      sessionsRemaining: m.sessionsRemaining
    }))
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}