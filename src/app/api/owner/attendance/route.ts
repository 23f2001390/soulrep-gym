import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/owner/attendance
 *
 * Returns a list of all attendance records in the system. Only the owner
 * can access this endpoint. Each record includes the member information
 * so the client can display names alongside IDs. The frontend can
 * aggregate this data (e.g. monthly summaries) as needed.
 */
export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const role = (session.user as any).role as string
  if (role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const records = await prisma.attendanceRecord.findMany({
      include: {
        member: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    })
    const data = records.map(r => ({
      id: r.id,
      memberId: r.memberId,
      memberName: r.member?.user?.name || '',
      date: r.date.toISOString().split('T')[0],
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      method: r.method
    }))
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}