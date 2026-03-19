import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/mail'

/**
 * GET /api/owner/members
 * 
 * Returns a list of all members with detailed status and assigned trainer info.
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
    const members = await prisma.member.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        trainer: { include: { user: { select: { name: true } } } }
      },
      orderBy: { joinDate: 'desc' }
    })
    const data = members.map(m => ({
      id: m.id,
      name: m.user.name,
      email: m.user.email,
      phone: m.user.phone,
      plan: m.plan,
      planStatus: m.planStatus,
      planExpiry: m.planExpiry.toISOString().split('T')[0],
      attendanceCount: m.attendanceCount,
      sessionsRemaining: m.sessionsRemaining,
      age: m.age,
      gender: m.gender,
      healthNotes: m.healthNotes || '',
      trainer: m.trainer ? {
        id: m.trainer.id,
        name: m.trainer.user.name,
        specialization: m.trainer.specialization
      } : null
    }))
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/owner/members
 * 
 * Allows the owner to update member details like plan, trainer, or status.
 */
export async function PATCH(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const role = (session.user as any).role as string
  if (role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { memberId, plan, trainerId, planStatus, sessionsRemaining, planExpiry } = await req.json()

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (plan) updateData.plan = plan
    if (trainerId !== undefined) updateData.trainerId = trainerId
    if (planStatus) updateData.planStatus = planStatus
    if (sessionsRemaining !== undefined) updateData.sessionsRemaining = sessionsRemaining
    if (planExpiry) updateData.planExpiry = new Date(planExpiry)

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: updateData,
      include: {
        user: { select: { email: true, name: true } },
        trainer: { include: { user: { select: { name: true } } } }
      }
    })

    // Notify member if trainer was reassigned via in-app notification
    if (trainerId && updated.trainer) {
      await prisma.notification.create({
        data: {
          userId: updated.id,
          title: "Trainer Reassigned",
          message: `Your trainer has been reassigned to ${updated.trainer.user.name} (${updated.trainer.specialization}).`,
        }
      })
    }

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/owner/members
 * 
 * Allows the owner to remove a member.
 */
export async function DELETE(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const role = (session.user as any).role as string
  if (role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    // Delete the user record, which cascades to Member
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    await prisma.user.delete({
      where: { id: memberId }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}