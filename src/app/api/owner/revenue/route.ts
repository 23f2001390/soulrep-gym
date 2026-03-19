import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/**
 * GET /api/owner/revenue
 *
 * Returns monthly revenue and member counts based on invoices. The
 * aggregation covers the last six calendar months, including the current
 * month. Only accessible by the owner.
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
    const now = new Date()
    // Determine the first day of the earliest month (6 months ago)
    const months: { month: string; revenue: number; members: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(dt)
      const end = new Date(dt)
      end.setMonth(dt.getMonth() + 1)
      // Sum paid invoices in this month
      const invoices = await prisma.invoice.findMany({
        where: {
          status: 'PAID',
          date: { gte: start, lt: end }
        },
        select: { amount: true, memberId: true }
      })
      const revenue = invoices.reduce((sum, inv) => sum + inv.amount, 0)
      // Number of unique members who paid in this month
      const uniqueMembers = new Set(invoices.map(inv => inv.memberId))
      months.push({
        month: monthNames[dt.getMonth()],
        revenue,
        members: uniqueMembers.size
      })
    }
    return NextResponse.json(months)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}