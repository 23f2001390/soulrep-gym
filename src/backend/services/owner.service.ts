import { prisma } from '../shared/prisma'
import { Role, PlanStatus } from '@prisma/client'

function formatAttendanceTime(value: Date | null): string | null {
  if (!value) return null

  return value.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export async function getKPIs() {
  try {
    const totalMembers = await prisma.member.count()
    const activePlans = await prisma.member.count({ where: { planStatus: 'ACTIVE' } })
    const revenueAgg = await prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true }
    })
    const revenue = revenueAgg._sum.amount ?? 0
    const now = new Date()
    const in7days = new Date(now)
    in7days.setDate(now.getDate() + 7)
    const expiringSoon = await prisma.member.count({
      where: { planExpiry: { lte: in7days } }
    })
    return { data: { totalMembers, activePlans, revenue, expiringSoon } }
  } catch (error) {
    console.error('Error fetching KPIs:', error)
    return { error: 'Failed to fetch KPIs', status: 500 }
  }
}

export async function getRevenueData() {
  try {
    const now = new Date()
    const months: any[] = []
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(dt)
      const end = new Date(dt)
      end.setMonth(dt.getMonth() + 1)
      const invoices = await prisma.invoice.findMany({
        where: { status: 'PAID', date: { gte: start, lt: end } },
        select: { amount: true, memberId: true }
      })
      const revenue = invoices.reduce((sum, inv) => sum + inv.amount, 0)
      const uniqueMembers = new Set(invoices.map(inv => inv.memberId))
      months.push({ month: dt.toLocaleString('default', { month: 'short' }), revenue, members: uniqueMembers.size })
    }
    return { data: months }
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    return { error: 'Failed to fetch revenue data', status: 500 }
  }
}

export async function getTrainerRatings() {
  try {
    const trainers = await prisma.trainer.findMany({
      include: {
        user: { select: { name: true } },
        Review: {
          select: {
            rating: true
          }
        }
      }
    })

    const result = trainers.map(t => {
      const reviewCount = t.Review.length
      const avgRating = reviewCount > 0 
        ? t.Review.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
        : 0
      
      return {
        id: t.id,
        name: t.user?.name || 'Unknown',
        rating: avgRating,
        reviewCount: reviewCount
      }
    }).sort((a, b) => b.rating - a.rating)

    return { data: result }
  } catch (error) {
    console.error('Error fetching trainer ratings:', error)
    return { error: 'Failed to fetch trainer ratings', status: 500 }
  }
}

export async function getExpiringMembers() {
  try {
    const now = new Date()
    const in7days = new Date(now)
    in7days.setDate(now.getDate() + 7)
    const expiring = await prisma.member.findMany({
      where: { planExpiry: { lte: in7days } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { planExpiry: 'asc' }
    })
    return { data: expiring.map(m => ({ id: m.id, name: m.user?.name || 'Unknown', email: m.user?.email || 'N/A', plan: m.plan, expiry: m.planExpiry, planStatus: m.planStatus })) }
  } catch (error) {
    console.error('Error fetching expiring members:', error)
    return { error: 'Failed to fetch expiring members', status: 500 }
  }
}

export async function getMembers() {
  try {
    const members = await prisma.member.findMany({
      include: { user: true, trainer: { include: { user: { select: { name: true } } } } },
      orderBy: { joinDate: 'desc' }
    })
    return { data: members.map(m => ({
      id: m.id, name: m.user?.name || 'Unknown', email: m.user?.email || 'N/A', phone: m.user?.phone || 'N/A',
      joinDate: m.joinDate, plan: m.plan, planExpiry: m.planExpiry ? m.planExpiry.toISOString().split('T')[0] : 'N/A',
      planStatus: m.planStatus, attendanceCount: m.attendanceCount, sessionsRemaining: m.sessionsRemaining,
      age: m.age, gender: m.gender, healthNotes: m.healthNotes, trainerId: m.trainerId,
      trainer: m.trainer ? { id: m.trainer.id, name: m.trainer.user?.name || 'Unknown', specialization: m.trainer.specialization } : null
    }))}
  } catch (error) {
    console.error('Error fetching members:', error)
    return { error: 'Failed to fetch members', status: 500 }
  }
}

export async function updateMember(memberId: string, updateData: any) {
  try {
    const updated = await prisma.member.update({
      where: { id: memberId },
      data: updateData,
      include: {
        trainer: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    })
    return { data: updated }
  } catch (error) {
    console.error('Error updating member:', error)
    return { error: 'Failed to update member', status: 500 }
  }
}

export async function deleteMember(memberId: string) {
  try {
    // Delete related records first if necessary, but Member and User are usually handled by cascade or manual
    await prisma.member.delete({ where: { id: memberId } })
    await prisma.user.delete({ where: { id: memberId } })
    return { data: { success: true } }
  } catch (error) {
    console.error('Error deleting member:', error)
    return { error: 'Failed to delete member', status: 500 }
  }
}

export async function getAttendanceRecords() {
  try {
    const records = await prisma.attendanceRecord.findMany({
      include: { member: { include: { user: { select: { name: true } } } } },
      orderBy: { date: 'desc' }
    })
    return { data: records.map(r => ({
      id: r.id, memberId: r.memberId, memberName: r.member?.user?.name || 'Unknown',
      date: r.date.toISOString().split('T')[0],
      checkIn: formatAttendanceTime(r.checkIn),
      checkOut: formatAttendanceTime(r.checkOut),
      method: r.method
    }))}
  } catch (error) {
    console.error('Error in getAttendanceRecords:', error)
    return { error: 'Failed to fetch attendance records', status: 500 }
  }
}

export async function getInvoices() {
  try {
    const invoices = await prisma.invoice.findMany({
      select: {
        id: true,
        memberId: true,
        plan: true,
        amount: true,
        date: true,
        status: true,
        member: { include: { user: { select: { name: true } } } },
      },
      orderBy: { date: 'desc' }
    })
    return { data: invoices.map(inv => ({
      id: inv.id, memberId: inv.memberId, memberName: inv.member?.user?.name || 'Unknown',
      plan: inv.plan, amount: inv.amount, date: inv.date.toISOString().split('T')[0], status: inv.status
    }))}
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return { error: 'Failed to fetch invoices', status: 500 }
  }
}

import { inngest } from '../../lib/inngest'

export async function createInvoice(invoiceData: any) {
  try {
    const { memberId, plan, amount, date, status } = invoiceData
    const invoice = await prisma.invoice.create({
      data: { memberId, plan, amount: parseFloat(amount), date: new Date(date || Date.now()), status: status || 'PENDING' }
    })

    // Trigger background processing
    await inngest.send({
      name: "app/invoice.created",
      data: {
        invoiceId: invoice.id,
        memberId: invoice.memberId,
      },
    });

    return { data: invoice }
  } catch (error) {
    console.error('Error creating invoice:', error)
    return { error: 'Failed to create invoice', status: 500 }
  }
}

export async function getEquipment() {
  try {
    const equipment = await prisma.equipment.findMany({
      include: { maintenanceLogs: { orderBy: { date: 'desc' }, take: 5 } },
      orderBy: { updatedAt: 'desc' }
    })
    return { data: equipment }
  } catch (error) {
    console.error('Error fetching equipment:', error)
    return { error: 'Failed to fetch equipment', status: 500 }
  }
}

export async function createEquipment(data: any) {
  try {
    const equipment = await prisma.equipment.create({
      data: { name: data.name, category: data.category, status: data.status || 'Operational', purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null }
    })
    return { data: equipment }
  } catch (error) {
    console.error('Error creating equipment:', error)
    return { error: 'Failed to create equipment', status: 500 }
  }
}

export async function updateEquipment(id: string, data: any) {
  try {
    const { status, maintenance } = data
    const updateData: any = {}
    if (status) updateData.status = status
    if (maintenance) {
      updateData.lastMaintenance = new Date()
      updateData.maintenanceLogs = { create: { date: new Date(), type: maintenance.type, description: maintenance.description, cost: maintenance.cost, performedBy: maintenance.performedBy } }
    }
    const updated = await prisma.equipment.update({ where: { id }, data: updateData })
    return { data: updated }
  } catch (error) {
    console.error('Error updating equipment:', error)
    return { error: 'Failed to update equipment', status: 500 }
  }
}

export async function markManualAttendance(memberId: string) {
  if (!memberId) return { error: 'Member ID is required', status: 400 }
  try {
    const member = await prisma.member.findUnique({ where: { id: memberId } })
    if (!member) return { error: 'Member profile not found', status: 404 }
    const todayStr = new Date().toISOString().split('T')[0]
    const today = new Date(todayStr + 'T00:00:00.000Z')
    const now = new Date()
    const existing = await prisma.attendanceRecord.findFirst({ where: { memberId, date: today } })
    if (existing) return { error: 'Member already checked in today', status: 400 }
    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.attendanceRecord.create({ data: { memberId, date: today, checkIn: now, method: 'MANUAL' } })
      await tx.member.update({ where: { id: memberId }, data: { attendanceCount: { increment: 1 }, sessionsRemaining: { decrement: 1 } } })
      return newRecord
    })
    return {
      data: {
        ...record,
        date: record.date.toISOString().split('T')[0],
        checkIn: formatAttendanceTime(record.checkIn),
        checkOut: formatAttendanceTime(record.checkOut),
      },
      status: 201
    }
  } catch (error) {
    console.error('[MarkManualAttendance] Error:', error)
    return { error: 'Failed to record manual attendance', status: 500 }
  }
}
