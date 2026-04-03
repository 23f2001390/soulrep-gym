import { prisma } from '../../shared/prisma'

/**
 * Fetches bookings for a member.
 * Supports filtering by trainer or by upcoming dates.
 * This is used for both the "My Bookings" list and checking trainer availability.
 */
export async function getBookings(memberId: string, upcoming: boolean = false, status?: string, trainerId?: string) {
  try {
    const where: any = {}
    if (trainerId) {
      // Searching for a specific trainer's schedule. 
      // We exclude CANCELLED slots as those are technically "available" now.
      where.trainerId = trainerId
      where.NOT = { status: 'CANCELLED' }
    } else {
      // General search for the member's own history.
      where.memberId = memberId
    }

    if (status) where.status = status as any
    // Only show sessions from this moment forward.
    if (upcoming) where.date = { gte: new Date() }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { date: 'asc' },
      select: {
        id: true, trainerId: true, date: true, time: true, status: true,
        trainer: { select: { user: { select: { name: true } } } },
      }
    })

    return { data: bookings.map(b => ({
      id: b.id, trainerId: b.trainerId, trainerName: b.trainer.user?.name,
      date: b.date, time: b.time, status: b.status
    }))}
  } catch (error) {
    console.error('[GetBookings] Error:', error)
    return { error: 'Failed to fetch bookings', status: 500 }
  }
}

/**
 * Handles the logic for booking a personal training session.
 * Now sets status to CONFIRMED directly as part of our direct booking flow.
 */
export async function createBooking(memberId: string, trainerId: string, date: string, time: string) {
  if (!trainerId || !date || !time) return { error: 'Missing required fields', status: 400 }

  const member = await prisma.member.findUnique({ where: { id: memberId } })
  if (!member) return { error: 'Member not found', status: 404 }

  // Check if the user has PT sessions left in their current plan.
  if (member.sessionsRemaining <= 0) return { error: 'No trainer sessions remaining on your plan', status: 403 }

  const bookingDate = new Date(date + 'T00:00:00.000Z')

  // Prevent double-booking the same trainer slot at the same time.
  const existingSlot = await prisma.booking.findFirst({
    where: { trainerId, date: bookingDate, time, NOT: { status: 'CANCELLED' } },
    select: { id: true }
  })
  if (existingSlot) return { error: 'Slot already booked by another member', status: 409 }

  // Restrict members to a maximum of one session per day to avoid overbooking.
  const alreadyBookedToday = await prisma.booking.findFirst({
    where: { memberId, date: bookingDate, NOT: { status: 'CANCELLED' } },
    select: { id: true }
  })
  if (alreadyBookedToday) return { error: 'You already have a session booked for this day', status: 400 }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the confirmed booking record.
      const booking = await tx.booking.create({
        data: { memberId, trainerId, date: bookingDate, time, status: 'CONFIRMED' },
        select: { id: true, trainerId: true, date: true, time: true, status: true, 
        trainer: { include: { user: { select: { name: true } } } }, 
        member: { include: { user: { select: { name: true } } } } },
      })

      // 2. Alert the trainer so they can prepare for the session.
      await tx.notification.create({
        data: { userId: trainerId, title: "New Session Booking",
        message: `${booking.member.user?.name || 'A member'} has booked a session on ${date} at ${time}.` }
      })

      // 3. Deduct one PT session from the user's balance.
      await tx.member.update({ where: { id: memberId }, data: { sessionsRemaining: { decrement: 1 } } })
      
      return booking
    })

    return { 
      data: { id: result.id, trainerId: result.trainerId, trainerName: result.trainer.user?.name, 
      date: result.date, time: result.time, status: result.status }, 
      status: 201 
    }
  } catch (error) {
    console.error('[CreateBooking] Transaction failed:', error)
    return { error: 'Failed to create booking', status: 500 }
  }
}

