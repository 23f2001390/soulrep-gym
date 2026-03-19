import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/owner/invoices
 * Generates a new invoice for a member.
 * Also triggers an in-app notification for the member.
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const role = (session.user as any).role as string
  if (role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { memberId, plan, amount, date, status } = await req.json()
    if (!memberId || !plan || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the invoice
      const invoice = await tx.invoice.create({
        data: {
          memberId,
          plan,
          amount: parseFloat(amount),
          date: new Date(date || Date.now()),
          status: status || 'PENDING'
        }
      })

      // 2. Create a notification for the member
      await tx.notification.create({
        data: {
          userId: memberId,
          title: "New Invoice Generated",
          message: `Your invoice for the ${plan} plan (₹${amount}) has been generated. Status: ${status || 'PENDING'}.`,
        }
      })

      return invoice
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/owner/invoices
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
    const invoices = await prisma.invoice.findMany({
      include: {
        member: {
          include: {
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { date: 'desc' }
    })
    const data = invoices.map(inv => ({
      id: inv.id,
      memberId: inv.memberId,
      memberName: inv.member.user.name,
      plan: inv.plan,
      amount: inv.amount,
      date: inv.date.toISOString().split('T')[0],
      status: inv.status
    }))
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}