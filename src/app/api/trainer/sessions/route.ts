import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/trainer/sessions
 *
 * Returns training sessions for the authenticated trainer. Supports an
 * optional `date` query parameter in YYYY-MM-DD format to return only
 * sessions on that day. The response includes member names and whether
 * each session was completed.
 */
export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = (session.user as any).id as string
  const role = (session.user as any).role as string
  if (role !== 'TRAINER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')
    const where: any = { trainerId: id }
    if (dateParam) {
      const date = new Date(dateParam)
      const nextDate = new Date(date)
      nextDate.setDate(date.getDate() + 1)
      where.date = {
        gte: date,
        lt: nextDate
      }
    }
    const sessions = await prisma.sessionLog.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        member: { select: { user: { select: { name: true } } } }
      }
    })
    const result = sessions.map(s => ({
      id: s.id,
      date: s.date,
      duration: s.duration,
      exercises: s.exercises,
      notes: s.notes,
      completed: s.completed,
      memberId: s.memberId,
      memberName: s.member.user?.name
    }))
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}