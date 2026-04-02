import { prisma } from '../../shared/prisma'

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
