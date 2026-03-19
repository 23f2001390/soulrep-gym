import { NextResponse, NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/member/attendance
 * Marks attendance for the authenticated member.
 * Validates the cryptographic code from the Owner terminal.
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const memberId = (session.user as any).id as string
  const role = (session.user as any).role as string
  
  if (role !== 'MEMBER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { code } = await req.json()
    if (!code) {
      return NextResponse.json({ error: 'QR Code is required' }, { status: 400 })
    }

    // Validate QR Code (Simplified cryptographic check)
    // Decode: "SOULREP_GYM_SECRET:timestamp"
    try {
      const decoded = atob(code)
      const [secret, timestampStr] = decoded.split(':')
      const timestamp = parseInt(timestampStr, 10)
      const currentTimestamp = Math.floor(Date.now() / 60000)

      if (secret !== "SOULREP_GYM_SECRET" || Math.abs(currentTimestamp - timestamp) > 2) {
        return NextResponse.json({ error: 'Invalid or Expired QR Code' }, { status: 400 })
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid QR Code format' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })

    // Check if already checked in today
    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        memberId,
        date: today
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Already checked in today' }, { status: 400 })
    }

    // Create record and increment member's attendance count
    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.attendanceRecord.create({
        data: {
          memberId,
          date: today,
          checkIn: now,
          method: 'QR'
        }
      })

      await tx.member.update({
        where: { id: memberId },
        data: {
          attendanceCount: { increment: 1 }
        }
      })

      return newRecord
    })

    return NextResponse.json(record)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = (session.user as any).id as string
  const role = (session.user as any).role as string
  if (role !== 'MEMBER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined
    const records = await prisma.attendanceRecord.findMany({
      where: { memberId: id },
      orderBy: { date: 'desc' },
      take: limit
    })
    return NextResponse.json(records)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}