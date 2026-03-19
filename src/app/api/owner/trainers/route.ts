import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/owner/trainers
 *
 * Returns a list of all trainers with high-level details (name, specialization,
 * rating, reviewCount, memberCount, availability and schedule). Only the
 * owner can access this endpoint.
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
    const trainers = await prisma.trainer.findMany({
      include: {
        user: { select: { name: true } }
      },
      orderBy: { rating: 'desc' }
    })
    const data = trainers.map(t => ({
      id: t.id,
      name: t.user.name,
      specialization: t.specialization,
      rating: t.rating,
      reviewCount: t.reviewCount,
      memberCount: t.memberCount,
      availability: t.availability,
      schedule: t.schedule || {}
    }))
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}