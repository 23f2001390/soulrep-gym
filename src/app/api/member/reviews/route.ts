import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/member/reviews
 *
 * Returns reviews for the authenticated member's trainer. This allows
 * members to see what others have said about their trainer. Each
 * review includes the rating, feedback, date and anonymous member name.
 * Only members can access this endpoint.
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
      return NextResponse.json([])
    }
    const reviews = await prisma.review.findMany({
      where: { trainerId: member.trainerId },
      orderBy: { date: 'desc' },
      include: { member: { select: { user: { select: { name: true } } } } }
    })
    const result = reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      feedback: r.feedback,
      date: r.date,
      trainerId: r.trainerId,
      memberId: r.memberId,
      memberName: r.member?.user?.name
    }))
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/member/reviews
 *
 * Allows a member to submit a review for their trainer. The request body
 * must include `trainerId` and `rating`. An optional `feedback` field
 * can be provided. The endpoint verifies that the trainerId matches
 * the member's assigned trainer. On success, it creates a new review,
 * updates the trainer's average rating and review count, and returns
 * the created review.
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const memberId = (session.user as any).id as string
  const role = (session.user as any).role as string
  if (role !== 'MEMBER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const { trainerId, rating, feedback } = body || {}
    if (!trainerId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    // Verify that the trainer is the member's assigned trainer
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { trainerId: true }
    })
    if (!member || member.trainerId !== trainerId) {
      return NextResponse.json({ error: 'Invalid trainer' }, { status: 400 })
    }
    // Create review and update trainer's average rating in a transaction
    const result = await prisma.$transaction(async tx => {
      const review = await tx.review.create({
        data: {
          memberId,
          trainerId,
          rating,
          feedback: feedback || '',
          date: new Date()
        },
        include: {
          member: { include: { user: { select: { name: true } } } }
        }
      })

      // Update trainer rating and reviewCount
      const trainer = await tx.trainer.findUnique({ where: { id: trainerId } })
      if (trainer) {
        const newCount = trainer.reviewCount + 1
        const newRating = ((trainer.rating * trainer.reviewCount) + rating) / newCount
        await tx.trainer.update({
          where: { id: trainerId },
          data: { rating: newRating, reviewCount: newCount }
        })
      }

      // Create notification for the trainer
      await tx.notification.create({
        data: {
          userId: trainerId,
          title: "New Review Received",
          message: `${review.member?.user?.name || 'A member'} left you a ${rating}-star review.`,
        }
      })

      return review
    })
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}