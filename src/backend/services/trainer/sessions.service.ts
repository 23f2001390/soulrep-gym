import { prisma } from '../../shared/prisma'

export async function getTrainerSessions(trainerId: string, date: string) {
  try {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    // Get day name
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = days[startOfDay.getDay()]

    const bookings = await prisma.booking.findMany({
      where: {
        trainerId,
        date: { gte: startOfDay, lte: endOfDay }
      },
      select: {
        id: true,
        status: true,
        time: true,
        date: true,
        member: { 
          include: { 
            user: { select: { name: true } },
            WorkoutPlan: {
              where: { day: dayName },
              include: { exercises: true }
            }
          } 
        } 
      },
    })
    
    const result = bookings.map(b => {
      const workoutPlan = b.member.WorkoutPlan[0] || null
      return {
        id: b.id,
        memberName: b.member?.user?.name || 'Unknown Member',
        duration: 60,
        completed: b.status === 'CONFIRMED',
        time: b.time,
        date: b.date,
        workout: workoutPlan ? {
          day: workoutPlan.day,
          exercises: workoutPlan.exercises.map(e => ({
            name: e.name,
            sets: e.sets,
            reps: e.reps
          }))
        } : null,
        notes: ''
      }
    })
    
    return { data: result }
  } catch (error) {
    console.error('Error in getTrainerSessions:', error)
    return { error: 'Failed to fetch trainer sessions', status: 500 }
  }
}

export async function confirmBooking(trainerId: string, bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking || booking.trainerId !== trainerId) {
      return { error: 'Booking not found', status: 404 }
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
    })

    return { data: updated }
  } catch (error) {
    console.error('Error in confirmBooking:', error)
    return { error: 'Internal server error', status: 500 }
  }
}

export async function completeBooking(trainerId: string, bookingId: string, notes?: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        member: {
          include: {
            WorkoutPlan: {
              where: {
                day: {
                  equals: new Date().toLocaleDateString('en-US', { weekday: 'long' })
                }
              },
              include: { exercises: true }
            }
          }
        }
      }
    })

    if (!booking || booking.trainerId !== trainerId) {
      return { error: 'Booking not found', status: 404 }
    }

    return await prisma.$transaction(async (tx) => {
      const workoutPlan = booking.member.WorkoutPlan[0]
      const exercisesStr = workoutPlan?.exercises.map(e => `${e.name} (${e.sets}x${e.reps})`) || []

      await tx.sessionLog.create({
        data: {
          memberId: booking.memberId,
          trainerId,
          date: booking.date,
          duration: 60,
          exercises: exercisesStr,
          completed: true,
        }
      })

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
      })

      return { data: updated }
    })
  } catch (error) {
    console.error('Error in completeBooking:', error)
    return { error: 'Internal server error', status: 500 }
  }
}
