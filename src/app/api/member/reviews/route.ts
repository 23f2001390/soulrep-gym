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

  const { searchParams } = new URL(req.url)
  const queryTrainerId = searchParams.get('trainerId')

  try {
    let trainerId = queryTrainerId

    // If no trainerId provided, default to assigned trainer
    if (!trainerId) {
      const member = await prisma.member.findUnique({
        where: { id },
        select: { trainerId: true }
      })
      trainerId = member?.trainerId || null
    }

    if (!trainerId) {
      return NextResponse.json([])
    }

    const reviews = await prisma.review.findMany({
      where: { trainerId },
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
 * Allows a member to submit or update a review for any trainer.
 * Ensures only one review per member-trainer pair exists.
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

    // Verify trainer exists
    const targetTrainer = await prisma.trainer.findUnique({ where: { id: trainerId } })
    if (!targetTrainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
    }

    // Check if member exists
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { user: { select: { name: true } } }
    })
    if (!member) {
      return NextResponse.json({ error: 'Member profile not found' }, { status: 404 })
    }

    // Check for existing review
    const existingReview = await prisma.review.findFirst({
      where: { memberId, trainerId }
    })

    let finalReview;

    if (existingReview) {
      // Update existing review
      finalReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          feedback: feedback || '',
          date: new Date()
        },
        include: { member: { include: { user: { select: { name: true } } } } }
      })

      // Recalculate average rating
      const agg = await prisma.review.aggregate({
        _avg: { rating: true },
        where: { trainerId }
      })

      await prisma.trainer.update({
        where: { id: trainerId },
        data: { rating: agg._avg.rating || 0 }
      })
    } else {
      // Create new review
      finalReview = await prisma.review.create({
        data: {
          memberId,
          trainerId,
          rating,
          feedback: feedback || '',
          date: new Date()
        },
        include: { member: { include: { user: { select: { name: true } } } } }
      })

      // Update trainer rating and reviewCount
      const trainer = await prisma.trainer.findUnique({ where: { id: trainerId } })
      if (trainer) {
        const newCount = trainer.reviewCount + 1
        const newRating = ((trainer.rating * trainer.reviewCount) + rating) / newCount
        await prisma.trainer.update({
          where: { id: trainerId },
          data: { rating: newRating, reviewCount: newCount }
        })
      }
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: trainerId,
        title: existingReview ? "Review Updated" : "New Review Received",
        message: `${member.user.name} ${existingReview ? 'updated their' : 'left a'} ${rating}-star review.`,
      }
    })

    const result = finalReview;

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}