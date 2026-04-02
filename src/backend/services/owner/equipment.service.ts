import { prisma } from '../../shared/prisma'

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
