import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/member/trainer
 *
 * Returns the trainer assigned to the authenticated member. Includes
 * specialization, rating and availability. If the member has no trainer,
 * returns 404.
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
    const member = await prisma.member.findUnique({
      where: { id },
      select: { trainerId: true }
    })
    if (!member || !member.trainerId) {
      return NextResponse.json({ error: 'No trainer assigned' }, { status: 404 })
    }
    const trainer = await prisma.trainer.findUnique({
      where: { id: member.trainerId },
      include: { user: true }
    })
    if (!trainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
    }
    return NextResponse.json({
      id: trainer.id,
      name: trainer.user?.name,
      email: trainer.user?.email,
      phone: trainer.user?.phone,
      specialization: trainer.specialization,
      rating: trainer.rating,
      reviewCount: trainer.reviewCount,
      memberCount: trainer.memberCount,
      availability: trainer.availability,
      schedule: trainer.schedule
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}