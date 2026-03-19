import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/owner/trainer-ratings
 *
 * Returns each trainer's first name, rating and number of reviews. Only
 * accessible by the owner.
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
        user: true
      }
    })
    const result = trainers.map(t => {
      const firstName = t.user?.name?.split(' ')[0] || ''
      return {
        name: firstName,
        rating: t.rating,
        reviews: t.reviewCount
      }
    })
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}