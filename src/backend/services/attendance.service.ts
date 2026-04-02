import { prisma } from '../shared/prisma'

export function formatAttendanceTime(value: Date | null): string | null {
  if (!value) return null

  return value.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

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
