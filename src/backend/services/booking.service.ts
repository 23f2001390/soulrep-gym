import { prisma } from '../shared/prisma'

export async function getBookings(memberId: string, upcoming: boolean = false, status?: string) {
  try {
    const where: any = { memberId }
    if (status) {
      where.status = status as any
    }
    if (upcoming) {
      where.date = { gte: new Date() }
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { date: 'asc' },
      select: {
        id: true,
        trainerId: true,
        date: true,
        time: true,
        status: true,
        trainer: {
          select: { user: { select: { name: true } } }
        },
      }
    })

    const result = bookings.map((b: any) => ({
      id: b.id,
      trainerId: b.trainerId,
      trainerName: b.trainer.user?.name,
      date: b.date,
      time: b.time,
      status: b.status
    }))

    return { data: result }
  } catch (error) {
    return { error: 'Failed to fetch bookings', status: 500 }
  }
}

export async function createBooking(memberId: string, trainerId: string, date: string, time: string) {
  if (!trainerId || !date || !time) {
    return { error: 'Missing required fields', status: 400 }
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } })
  if (!member) {
    return { error: 'Member not found', status: 404 }
  }
  if (member.sessionsRemaining <= 0) {
    return { error: 'No trainer sessions remaining on your plan', status: 403 }
  }

  const bookingDate = new Date(date + 'T00:00:00.000Z')

  const existing = await prisma.booking.findFirst({
    where: {
      trainerId,
      date: bookingDate,
      time,
      NOT: { status: 'CANCELLED' }
    },
    select: { id: true }
  })

  if (existing) {
    return { error: 'Slot already booked', status: 409 }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          memberId,
          trainerId,
          date: bookingDate,
          time,
          status: 'PENDING'
        },
        select: {
          id: true,
          trainerId: true,
          date: true,
          time: true,
          status: true,
          trainer: { include: { user: { select: { name: true } } } },
          member: { include: { user: { select: { name: true } } } }
        },
      })

      await tx.notification.create({
        data: {
          userId: trainerId,
          title: "New Session Booking",
          message: `${booking.member.user?.name || 'A member'} has requested a session on ${date} at ${time}.`,
        }
      })

      // Decrement the PT sessions balance
      await tx.member.update({
        where: { id: memberId },
        data: { sessionsRemaining: { decrement: 1 } }
      })

      return booking
    })

    return {
      data: {
        id: result.id,
        trainerId: result.trainerId,
        trainerName: result.trainer.user?.name,
        date: result.date,
        time: result.time,
        status: result.status
      },
      status: 201
    }
  } catch (error) {
    return { error: 'Failed to create booking', status: 500 }
  }
}
