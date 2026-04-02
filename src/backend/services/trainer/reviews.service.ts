import { prisma } from '../../shared/prisma'

export async function getTrainerReviews(trainerId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { trainerId },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        rating: true,
        feedback: true,
        date: true,
      }
    })
    return { data: reviews }
  } catch (error) {
    console.error('Error in getTrainerReviews:', error)
    return { error: 'Failed to fetch trainer reviews', status: 500 }
  }
}
