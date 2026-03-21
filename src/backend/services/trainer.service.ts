import { prisma } from '../shared/prisma'
import { hash } from 'bcryptjs'


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
      include: { 
        user: true,
        Review: { select: { rating: true } },
        Members: { select: { id: true } }
      }
    })
    
    const result = trainers.map(t => {
      const reviewCount = t.Review.length
      const avgRating = reviewCount > 0 
        ? t.Review.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
        : 0
        
      return {
        id: t.id,
        name: t.user?.name || 'Unknown',
        email: t.user?.email || 'N/A',
        phone: t.user?.phone || 'N/A',
        specialization: t.specialization,
        rating: avgRating,
        reviewCount: reviewCount,
        memberCount: t.Members?.length || 0,
        availability: t.availability,
        schedule: t.schedule || { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] }
      }
    })

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
      include: { 
        user: { select: { name: true, email: true, phone: true } },
        Review: { 
          include: { 
            member: { include: { user: { select: { name: true } } } } 
          } 
        },
        Members: { 
          include: { 
            user: { select: { name: true } } 
          } 
        },
        Booking: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today onwards
            }
          },
          include: {
            member: { include: { user: { select: { name: true } } } }
          }
        }
      }
    })
    
    if (!trainer) {
      return { error: 'Trainer not found', status: 404 }
    }
    
    const reviewCount = trainer.Review.length
    const avgRating = reviewCount > 0 
      ? trainer.Review.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
      : 0

    // Build accurate schedule from bookings
    // Start with availability template if it exists, or a default one
    const baseSchedule: any = (trainer.schedule as any) || {
      Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
    }

    // Days map for filtering bookings
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    // Clear out session/booked types from baseSchedule (to get rid of mock data)
    // Keep availability/breaks if they are part of the template
    Object.keys(baseSchedule).forEach(day => {
      baseSchedule[day] = baseSchedule[day].filter((slot: any) => slot.type === 'available' || slot.type === 'break')
    })

    // Inject real bookings into the schedule
    trainer.Booking.forEach(booking => {
      const dayName = days[new Date(booking.date).getDay()]
      if (baseSchedule[dayName]) {
        // Simple slot calculation: assume 1 hour sessions
        const start = booking.time
        let hour = parseInt(start.split(':')[0])
        let end = `${(hour + 1).toString().padStart(2, '0')}:${start.split(':')[1]}`
        
        baseSchedule[dayName].push({
          start,
          end,
          type: 'session',
          memberId: booking.memberId,
          memberName: booking.member.user.name
        })
      }
    })

    // Sort slots by time
    Object.keys(baseSchedule).forEach(day => {
      baseSchedule[day].sort((a: any, b: any) => a.start.localeCompare(b.start))
    })

    const result = {
      id: trainer.id,
      name: trainer.user?.name || 'Unknown',
      email: trainer.user?.email || 'N/A',
      phone: trainer.user?.phone || 'N/A',
      specialization: trainer.specialization,
      rating: avgRating,
      reviewCount: reviewCount,
      memberCount: trainer.Members.length,
      availability: trainer.availability,
      schedule: baseSchedule,
      members: trainer.Members.map(m => ({
        id: m.id,
        name: m.user.name,
        plan: m.plan,
        status: m.planStatus,
        joinDate: m.joinDate.toISOString().split('T')[0]
      })),
      reviews: trainer.Review.map(r => ({
        id: r.id,
        name: r.member?.user?.name || 'Gym Member',
        rating: r.rating,
        comment: r.feedback,
        date: r.date.toISOString().split('T')[0]
      }))
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

export async function createTrainer(data: { name: string, email: string, specialization: string, password?: string, phone?: string }) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })
    
    if (existingUser) {
      return { error: 'User with this email already exists', status: 400 }
    }

    // Use provided password or fallback to a default
    const passwordToHash = data.password || 'trainer123'
    const hashedPassword = await hash(passwordToHash, 12)

    // Create user and trainer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: 'TRAINER',
          phone: data.phone
        }
      })

      const trainer = await tx.trainer.create({
        data: {
          id: user.id,
          specialization: data.specialization,
          availability: 'AVAILABLE',
          schedule: {
            Monday: [{ start: '06:00', end: '22:00', type: 'available' }],
            Tuesday: [{ start: '06:00', end: '22:00', type: 'available' }],
            Wednesday: [{ start: '06:00', end: '22:00', type: 'available' }],
            Thursday: [{ start: '06:00', end: '22:00', type: 'available' }],
            Friday: [{ start: '06:00', end: '22:00', type: 'available' }],
            Saturday: [{ start: '08:00', end: '20:00', type: 'available' }],
            Sunday: [{ start: '08:00', end: '14:00', type: 'available' }]
          }
        }
      })

      return { user, trainer }
    })

    return { data: result.trainer }
  } catch (error) {
    console.error('Error in createTrainer:', error)
    return { error: 'Failed to create trainer', status: 500 }
  }
}

