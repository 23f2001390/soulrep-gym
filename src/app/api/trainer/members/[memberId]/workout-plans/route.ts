import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/trainer/members/[memberId]/workout-plans
 *
 * Returns workout plans for a specific member assigned to the
 * authenticated trainer. Each plan includes the day, exercises and
 * notes. Only trainers can access this endpoint.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { memberId: string } }
) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const trainerId = (session.user as any).id as string
  const role = (session.user as any).role as string
  if (role !== 'TRAINER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const memberId = params.memberId
  try {
    // Verify that the member belongs to this trainer
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { trainerId: true }
    })
    if (!member || member.trainerId !== trainerId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    const plans = await prisma.workoutPlan.findMany({
      where: { memberId },
      orderBy: { dayOrder: 'asc' },
      include: { exercises: true }
    })
    const result = plans.map(p => ({
      id: p.id,
      day: p.day,
      dayOrder: p.dayOrder,
      notes: p.notes,
      exercises: p.exercises.map(e => ({
        id: e.id,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        rest: e.rest
      }))
    }))
    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}