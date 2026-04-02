import { prisma } from '../../shared/prisma'

export async function getTrainerMemberWorkoutPlans(trainerId: string, memberId: string) {
  const member = await prisma.member.findFirst({
    where: { 
      id: memberId,
      OR: [
        { trainerId },
        { Booking: { some: { trainerId, status: { in: ['PENDING', 'CONFIRMED'] } } } }
      ]
    }
  })
  
  if (!member) {
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

export async function createWorkoutPlan(trainerId: string, memberId: string, data: { day: string, notes?: string, exercises: any[] }) {
  try {
    const member = await prisma.member.findFirst({
      where: { 
        id: memberId,
        OR: [
          { trainerId },
          { Booking: { some: { trainerId, status: { in: ['PENDING', 'CONFIRMED'] } } } }
        ]
      }
    })
    
    if (!member) {
      return { error: 'Member not found or not authorized', status: 404 }
    }

    const plan = await prisma.workoutPlan.create({
      data: {
        trainerId,
        memberId,
        day: data.day,
        notes: data.notes,
        exercises: {
          create: data.exercises.map(ex => ({
            name: ex.name,
            sets: parseInt(ex.sets),
            reps: ex.reps,
            rest: ex.rest,
            notes: ex.notes
          }))
        }
      },
      include: { exercises: true }
    })

    return { data: plan }
  } catch (error) {
    console.error('Error in createWorkoutPlan:', error)
    return { error: 'Failed to create workout plan', status: 500 }
  }
}

export async function deleteWorkoutPlan(trainerId: string, planId: string) {
  try {
    const plan = await prisma.workoutPlan.findUnique({
      where: { id: planId }
    })

    if (!plan || plan.trainerId !== trainerId) {
      return { error: 'Plan not found or not authorized', status: 404 }
    }

    await prisma.workoutPlan.delete({
      where: { id: planId }
    })

    return { data: { success: true } }
  } catch (error) {
    console.error('Error in deleteWorkoutPlan:', error)
    return { error: 'Failed to delete workout plan', status: 500 }
  }
}
