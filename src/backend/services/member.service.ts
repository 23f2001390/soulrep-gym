import { prisma } from '../shared/prisma'

function formatAttendanceTime(value: Date | null): string | null {
  if (!value) return null

  return value.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', 
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Service to handle member-related logic.
 */
export async function getMemberProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { Member: true }
  })

  if (!user) {
    return { error: 'User not found', status: 404 }
  }

  // Self-healing: Create missing Member profile if role is MEMBER
  if (user.role === 'MEMBER' && !user.Member) {
    console.log(`[Healing] Creating missing member profile for user: ${user.id}`)
    const newMember = await prisma.member.create({
      data: {
        id: user.id,
        joinDate: new Date(),
        plan: 'MONTHLY',
        planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        planStatus: 'ACTIVE',
        attendanceCount: 0,
        sessionsRemaining: 30,
        age: 18,
        gender: 'OTHER'
      }
    })
    return {
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        member: newMember
      }
    }
  }

  if (user.role !== 'MEMBER') {
    return { error: 'User is not a member', status: 403 }
  }

  return {
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      member: user.Member
    }
  }
}

/**
 * Returns the trainer assigned to the member.
 */
export async function getTrainerForMember(userId: string) {
  const member = await prisma.member.findUnique({
    where: { id: userId },
    select: { trainerId: true }
  })

  if (!member) {
    return { error: 'Member profile not found', status: 404 }
  }

  if (!member.trainerId) {
    return { data: null, message: 'No trainer assigned' }
  }

  const trainer = await prisma.trainer.findUnique({
    where: { id: member.trainerId },
    include: { user: true }
  })

  if (!trainer) {
    return { error: 'Trainer not found', status: 404 }
  }

  return {
    data: {
      id: trainer.id,
      name: trainer.user?.name,
      email: trainer.user?.email,
      phone: trainer.user?.phone,
      specialization: trainer.specialization,
      rating: trainer.rating,
      reviewCount: trainer.reviewCount,
      memberCount: trainer.memberCount,
      availability: trainer.availability,
      schedule: trainer.schedule
    }
  }
}

/**
 * Assigns a trainer to a member.
 */
export async function assignTrainer(userId: string, trainerId: string) {
  try {
    const updatedMember = await prisma.member.update({
      where: { id: userId },
      data: { trainerId }
    })
    return { data: updatedMember }
  } catch (error) {
    return { error: 'Failed to assign trainer', status: 500 }
  }
}

/**
 * Returns attendance records for a member.
 */
export async function getAttendanceRecords(memberId: string, limit?: number) {
  try {
    const records = await prisma.attendanceRecord.findMany({
      where: { memberId },
      orderBy: { date: 'desc' },
      take: limit
    })
    return {
      data: records.map((record) => ({
        ...record,
        date: record.date.toISOString().split('T')[0],
        checkIn: formatAttendanceTime(record.checkIn),
        checkOut: formatAttendanceTime(record.checkOut),
      }))
    }
  } catch (error) {
    return { error: 'Failed to fetch attendance records', status: 500 }
  }
}

/**
 * Marks attendance for a member using a code.
 * Scanned code format: "soulrep-checkin|YYYY-MM-DD|base64_secret"
 */
export async function markAttendance(memberId: string, code: string) {
  if (!code) {
    return { error: 'QR Code is required', status: 400 }
  }

  try {
    if (code !== 'soulrep-checkin-static-qr') {
      return { error: 'Invalid QR Code', status: 400 }
    }

    const todayStr = new Date().toISOString().split('T')[0]

    // Check if member exists
    const member = await prisma.member.findUnique({ where: { id: memberId } })
    if (!member) {
      return { error: 'Member profile not found', status: 404 }
    }

    // Check if plan is expired
    if (new Date() > new Date(member.planExpiry)) {
      return { error: 'Membership plan has expired', status: 403 }
    }

    // Check if already checked in today
    const existing = await prisma.attendanceRecord.findFirst({
      where: { memberId, date: new Date(todayStr + 'T00:00:00.000Z') }
    })

    if (existing) {
      return { error: 'Already checked in today', status: 400 }
    }

    const now = new Date()
    const today = new Date(todayStr + 'T00:00:00.000Z')

    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.attendanceRecord.create({
        data: {
          memberId,
          date: today,
          checkIn: now,
          method: 'QR'
        }
      })

      // Update attendance count
      await tx.member.update({
        where: { id: memberId },
        data: {
          attendanceCount: { increment: 1 }
        }
      })

      return newRecord
    })

    return {
      data: {
        ...record,
        date: record.date.toISOString().split('T')[0],
        checkIn: formatAttendanceTime(record.checkIn),
        checkOut: formatAttendanceTime(record.checkOut),
      },
      status: 201
    }
  } catch (err) {
    console.error('[MarkAttendance] Error:', err)
    return { error: 'Failed to record attendance', status: 500 }
  }
}

/**
 * Returns bookings. If trainerId is provided, returns all bookings for that trainer (privacy-aware).
 * Otherwise returns bookings for the specified member.
 */
export async function getBookings(memberId: string, upcoming: boolean = false, status?: string, trainerId?: string) {
  try {
    const where: any = {}
    
    if (trainerId) {
      where.trainerId = trainerId
      // When fetching for a trainer, we usually want to omit cancelled ones 
      // so the slots show as available again
      where.NOT = { status: 'CANCELLED' }
    } else {
      where.memberId = memberId
    }

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
        // Only include trainer name if we're not filtering by trainer already
        // Or always include it for the member view
        trainer: {
          select: { user: { select: { name: true } } }
        },
      }
    })

    const result = bookings.map(b => ({
      id: b.id,
      trainerId: b.trainerId,
      trainerName: b.trainer.user?.name,
      date: b.date,
      time: b.time,
      status: b.status
    }))

    return { data: result }
  } catch (error) {
    console.error('[GetBookings] Error:', error)
    return { error: 'Failed to fetch bookings', status: 500 }
  }
}

/**
 * Creates a new booking.
 */
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



/**
 * Updates a member's profile information.
 */
export async function updateMemberProfile(userId: string, data: { name?: string, phone?: string, password?: string, age?: number, gender?: any }) {
  const { name, phone, password, age, gender } = data

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (phone !== undefined) updateData.phone = phone
  if (password !== undefined) {
    const { hashPassword } = await import('@/lib/auth')
    updateData.password = await hashPassword(password)
  }

  const memberUpdateData: any = {}
  if (age !== undefined) memberUpdateData.age = age
  if (gender !== undefined) memberUpdateData.gender = gender

  try {
    const result = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        Member: {
          update: {
            ...memberUpdateData
          }
        }
      },
      include: { Member: true }
    })

    return {
      data: {
        user: {
          id: result.id,
          email: result.email,
          name: result.name,
          role: result.role,
          phone: result.phone
        },
        member: result.Member
      }
    }
  } catch (error) {
    console.error('[UpdateProfile] Error:', error)
    return { error: 'Failed to update profile', status: 500 }
  }
}
