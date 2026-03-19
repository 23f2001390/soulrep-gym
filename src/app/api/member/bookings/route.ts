import { NextResponse, NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/member/bookings
 *
 * Returns all bookings for the authenticated member. Query parameters:
 *  - upcoming: if set to 'true', only future bookings are returned.
 *  - status: filter bookings by their status (CONFIRMED, PENDING, CANCELLED)
 */
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
    const upcomingParam = searchParams.get('upcoming')
    const statusParam = searchParams.get('status')
    const where: any = { memberId: id }
    if (statusParam) {
      where.status = statusParam as any
    }
    if (upcomingParam === 'true') {
      where.date = { gte: new Date() }
    }
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        trainer: {
          select: { user: { select: { name: true } } }
        }
      }
    })
    // Shape the response to include trainerName field for convenience
    const result = bookings.map(b => ({
      id: b.id,
      trainerId: b.trainerId,
      trainerName: b.trainer.user?.name,
      date: b.date,
      time: b.time,
      status: b.status
    }))
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/member/bookings
 *
 * Allows a member to create a new booking with a trainer. The request body
 * must include trainerId, date (YYYY-MM-DD) and time (HH:MM). The new
 * booking is created with a PENDING status. The endpoint checks for
 * conflicts with existing bookings for the same trainer/date/time and
 * rejects if a conflict exists. Only members can access this endpoint.
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
    const body = await req.json()
    const { trainerId, date, time } = body || {}
    if (!trainerId || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    // Parse date to start of day in UTC (assuming date string is in YYYY-MM-DD format)
    const bookingDate = new Date(date + 'T00:00:00.000Z')
    // Check for existing booking conflict (same trainer/date/time)
    const existing = await prisma.booking.findFirst({
      where: {
        trainerId,
        date: bookingDate,
        time,
        NOT: { status: 'CANCELLED' }
      }
    })
    if (existing) {
      return NextResponse.json({ error: 'Slot already booked' }, { status: 409 })
    }
    const booking = await prisma.booking.create({
      data: {
        memberId,
        trainerId,
        date: bookingDate,
        time,
        status: 'PENDING'
      },
      include: {
        trainer: { include: { user: { select: { name: true } } } }
      }
    })
    return NextResponse.json({
      id: booking.id,
      trainerId: booking.trainerId,
      trainerName: booking.trainer.user?.name,
      date: booking.date,
      time: booking.time,
      status: booking.status
    }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}