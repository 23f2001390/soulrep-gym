import { prisma } from '../shared/prisma'

export async function getReviews(memberId: string, queryTrainerId: string | null) {
  let trainerId = queryTrainerId

  if (!trainerId) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { trainerId: true }
    })
    trainerId = member?.trainerId || null
  }

  if (!trainerId) {
    return []
  }

  const reviews = await prisma.review.findMany({
    where: { trainerId },
    orderBy: { date: 'desc' },
    include: { member: { select: { user: { select: { name: true } } } } }
  })

  return reviews.map(r => ({
    id: r.id,
    rating: r.rating,
    feedback: r.feedback,
    date: r.date,
    trainerId: r.trainerId,
    memberId: r.memberId,
    memberName: r.member?.user?.name
  }))
}

export async function submitReview(memberId: string, trainerId: string, rating: number, feedback: string) {
  const targetTrainer = await prisma.trainer.findUnique({ where: { id: trainerId } })
  if (!targetTrainer) {
    throw new Error('Trainer not found')
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { user: { select: { name: true } } }
  })
  if (!member) {
    throw new Error('Member profile not found')
  }

  const existingReview = await prisma.review.findFirst({
    where: { memberId, trainerId }
  })

  let finalReview

  if (existingReview) {
    finalReview = await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating,
        feedback: feedback || '',
        date: new Date()
      },
      include: { member: { include: { user: { select: { name: true } } } } }
    })

    const agg = await prisma.review.aggregate({
      _avg: { rating: true },
      where: { trainerId }
    })

    await prisma.trainer.update({
      where: { id: trainerId },
      data: { rating: agg._avg.rating || 0 }
    })
  } else {
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

    const newCount = targetTrainer.reviewCount + 1
    const newRating = ((targetTrainer.rating * targetTrainer.reviewCount) + rating) / newCount
    await prisma.trainer.update({
      where: { id: trainerId },
      data: { rating: newRating, reviewCount: newCount }
    })
  }

  await prisma.notification.create({
    data: {
      userId: trainerId,
      title: existingReview ? "Review Updated" : "New Review Received",
      message: `${member.user.name || 'Anonymous user'} ${existingReview ? 'updated their' : 'left a'} ${rating}-star review.`,
    }
  })

  return finalReview
}
