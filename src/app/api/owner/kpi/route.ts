import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/owner/kpi
 *
 * Returns high level KPI metrics for the gym. Only the owner can access
 * this endpoint. Metrics include totalMembers, activePlans, revenue and
 * expiringSoon (members whose plan expires within the next 7 days).
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
    // Total members
    const totalMembers = await prisma.member.count()
    // Active plans
    const activePlans = await prisma.member.count({ where: { planStatus: 'ACTIVE' } })
    // Revenue: sum of all paid invoices amounts
    const revenueAgg = await prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true }
    })
    const revenue = revenueAgg._sum.amount ?? 0
    // Plans expiring within next 7 days
    const now = new Date()
    const in7days = new Date(now)
    in7days.setDate(now.getDate() + 7)
    const expiringSoon = await prisma.member.count({
      where: {
        planExpiry: { gte: now, lte: in7days }
      }
    })
    return NextResponse.json({
      totalMembers,
      activePlans,
      revenue,
      expiringSoon
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}