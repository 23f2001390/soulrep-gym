import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/owner/equipment
 * Returns a list of all equipment with their maintenance history.
 */
export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || (session.user as any).role !== 'OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const equipment = await prisma.equipment.findMany({
      include: {
        maintenanceLogs: {
          orderBy: { date: 'desc' },
          take: 5
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
    return NextResponse.json(equipment)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 })
  }
}

/**
 * POST /api/owner/equipment
 * Adds new equipment.
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || (session.user as any).role !== 'OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const equipment = await prisma.equipment.create({
      data: {
        name: body.name,
        category: body.category,
        status: body.status || 'Operational',
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      }
    })
    return NextResponse.json(equipment)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create equipment' }, { status: 500 })
  }
}

/**
 * PATCH /api/owner/equipment
 * Updates status or records maintenance.
 */
export async function PATCH(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || (session.user as any).role !== 'OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, status, maintenance } = await req.json()

    const updateData: any = {}
    if (status) updateData.status = status

    if (maintenance) {
      updateData.lastMaintenance = new Date()
      updateData.maintenanceLogs = {
        create: {
          date: new Date(),
          type: maintenance.type,
          description: maintenance.description,
          cost: maintenance.cost,
          performedBy: maintenance.performedBy
        }
      }
    }

    const updated = await prisma.equipment.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update equipment' }, { status: 500 })
  }
}
