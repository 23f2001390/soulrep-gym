import { NextRequest, NextResponse } from 'next/server'
import { PlanType } from '@prisma/client'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { prisma } from '@/backend/shared/prisma'
import { getPlanExpiryDate, getPlanInfo } from '@/lib/plans'

export async function GET() {
  const auth = await authenticate(['MEMBER'])
  if (auth.error) return auth.error

  const member = await prisma.member.findUnique({
    where: { id: auth.user.id },
    select: { planStatus: true, plan: true },
  })

  if (!member) {
    return NextResponse.json({ error: 'Member profile not found' }, { status: 404 })
  }

  const paidInvoiceCount = await prisma.invoice.count({
    where: { memberId: auth.user.id, status: 'PAID' },
  })

  const needsSetup = member.planStatus !== 'ACTIVE' || paidInvoiceCount === 0

  return NextResponse.json({
    needsSetup,
    memberPlan: member.plan,
    paidInvoiceCount,
  })
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(['MEMBER'])
  if (auth.error) return auth.error

  const body = await req.json()
  const { plan, paymentMethod } = body ?? {}

  if (!paymentMethod) {
    return NextResponse.json({ error: 'Payment method is required' }, { status: 400 })
  }

  const parsedPlan = Object.values(PlanType).includes(plan as PlanType)
    ? (plan as PlanType)
    : null

  if (!parsedPlan) {
    return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
  }

  const selectedPlan = getPlanInfo(parsedPlan)
  const now = new Date()

  try {
    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({
        where: { id: auth.user.id },
        select: { id: true, planStatus: true },
      })

      if (!member) {
        throw new Error('MEMBER_NOT_FOUND')
      }

      const paidInvoiceCount = await tx.invoice.count({
        where: { memberId: auth.user.id, status: 'PAID' },
      })

      if (member.planStatus === 'ACTIVE' && paidInvoiceCount > 0) {
        throw new Error('ALREADY_COMPLETED')
      }

      await tx.member.update({
        where: { id: auth.user.id },
        data: {
          plan: parsedPlan,
          planStatus: 'ACTIVE',
          planExpiry: getPlanExpiryDate(parsedPlan, now),
          sessionsRemaining: selectedPlan.sessionsPerMonth,
        },
      })

      const invoice = await tx.invoice.create({
        data: {
          memberId: auth.user.id,
          plan: parsedPlan,
          amount: selectedPlan.price,
          date: now,
          status: 'PAID',
        },
      })

      const owner = await tx.user.findFirst({ where: { role: 'OWNER' } })
      if (owner) {
        await tx.notification.create({
          data: {
            userId: owner.id,
            title: 'Member Signup Completed',
            message: `${auth.user.name || 'A member'} completed Google signup on ${selectedPlan.name} via mock ${paymentMethod} payment.`,
          },
        })
      }

      return invoice
    })

    return NextResponse.json({
      ok: true,
      payment: {
        mode: 'MOCK',
        status: 'SUCCESS',
        method: paymentMethod,
        amount: selectedPlan.price,
      },
      invoiceId: result.id,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'MEMBER_NOT_FOUND') {
      return NextResponse.json({ error: 'Member profile not found' }, { status: 404 })
    }
    if (error instanceof Error && error.message === 'ALREADY_COMPLETED') {
      return NextResponse.json({ error: 'Signup is already completed' }, { status: 409 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to complete signup payment' }, { status: 500 })
  }
}
