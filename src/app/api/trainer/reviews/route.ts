import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/trainer/reviews
 * Returns reviews for the authenticated trainer.
 * Reviews are anonymous (no member names shown).
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
    const reviews = await prisma.review.findMany({
      where: { trainerId: id },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        rating: true,
        feedback: true,
        date: true,
      }
    })
    return NextResponse.json(reviews)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}