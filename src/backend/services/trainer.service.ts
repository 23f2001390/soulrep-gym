import { prisma } from '../shared/prisma'

/**
 * Service to handle trainer-related logic.
 */
export async function getTrainerMemberWorkoutPlans(trainerId: string, memberId: string) {
  // Verify that the member belongs to this trainer
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { trainerId: true }
  })
  
  if (!member || member.trainerId !== trainerId) {
    return { error: 'Member not found', status: 404 }
  }

  const plans = await prisma.workoutPlan.findMany({
    where: { memberId },
    include: { exercises: true }
  })

  const result = plans.map(p => ({
    id: p.id,
    day: p.day,
    notes: p.notes,
    exercises: p.exercises.map(e => ({
      id: e.id,
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      rest: e.rest
    }))
  }))

  return { data: result }
}

/**
 * Get all trainers for selection
 */
export async function getTrainers() {
  try {
    const trainers = await prisma.trainer.findMany({
      include: { user: true }
    })
    
    const result = trainers.map(t => ({
      id: t.id,
      name: t.user?.name || 'Unknown',
      email: t.user?.email || 'N/A',
      phone: t.user?.phone || 'N/A',
      specialization: t.specialization,
      rating: t.rating,
      reviewCount: t.reviewCount,
      memberCount: t.memberCount,
      availability: t.availability,
      schedule: t.schedule
    }))

    return { data: result }
  } catch (error) {
    console.error('Error in getTrainers:', error)
    return { error: 'Failed to fetch trainers', status: 500 }
  }
}

export async function getTrainerProfile(trainerId: string) {
  try {
    const trainer = await prisma.trainer.findUnique({
      where: { id: trainerId },
      include: { user: { select: { name: true, email: true, phone: true } } }
    })
    if (!trainer) {
      return { error: 'Trainer not found', status: 404 }
    }
    const result = {
      id: trainer.id,
      name: trainer.user?.name || 'Unknown',
      email: trainer.user?.email || 'N/A',
      phone: trainer.user?.phone || 'N/A',
      specialization: trainer.specialization,
      rating: trainer.rating,
      reviewCount: trainer.reviewCount,
      memberCount: trainer.memberCount,
      availability: trainer.availability,
      schedule: trainer.schedule
    }
    return { data: result }
  } catch (error) {
    console.error('Error in getTrainerProfile:', error)
    return { error: 'Failed to fetch trainer profile', status: 500 }
  }
}

export async function getTrainerMembers(trainerId: string) {
  try {
    const members = await prisma.member.findMany({
      where: { trainerId },
      include: { user: { select: { name: true, email: true } } }
    })
    
    const result = members.map(m => ({
      id: m.id,
      name: m.user?.name || 'Unknown',
      email: m.user?.email || 'N/A',
      plan: m.plan,
      planStatus: m.planStatus,
      sessionsRemaining: m.sessionsRemaining
    }))
    
    return { data: result }
  } catch (error) {
    console.error('Error in getTrainerMembers:', error)
    return { error: 'Failed to fetch trainer members', status: 500 }
  }
}

export async function getTrainerSessions(trainerId: string, date: string) {
  try {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    const bookings = await prisma.booking.findMany({
      where: {
        trainerId,
        date: { gte: startOfDay, lte: endOfDay }
      },
      include: { 
        member: { 
          include: { 
            user: { select: { name: true } } 
          } 
        } 
      }
    })
    
    const result = bookings.map(b => ({
      id: b.id,
      memberName: b.member?.user?.name || 'Unknown Member',
      duration: 60,
      completed: b.status === 'CONFIRMED',
      exercises: [],
      notes: ''
    }))
    
    return { data: result }
  } catch (error) {
    console.error('Error in getTrainerSessions:', error)
    return { error: 'Failed to fetch trainer sessions', status: 500 }
  }
}

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
