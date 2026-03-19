import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/member/trainers
 *
 * Returns a list of trainers that members can book with. Each trainer
 * includes basic details such as name, specialization, rating,
 * availability and schedule. Only members can access this endpoint.
 */
export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const role = (session.user as any).role as string
  if (role !== 'MEMBER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const trainers = await prisma.trainer.findMany({
      include: { user: true }
    })
    const result = trainers.map(t => ({
      id: t.id,
      name: t.user?.name,
      email: t.user?.email,
      phone: t.user?.phone,
      specialization: t.specialization,
      rating: t.rating,
      reviewCount: t.reviewCount,
      memberCount: t.memberCount,
      availability: t.availability,
      schedule: t.schedule
    }))
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}