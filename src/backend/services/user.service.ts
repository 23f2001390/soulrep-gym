import { prisma } from '../shared/prisma'
import { hashPassword } from '@/lib/auth'

/**
 * Updates core user profile information (Name, Phone, Password).
 * Optionally updates role-specific details if a sub-table exists.
 */
export async function updateGenericProfile(userId: string, data: { 
  name?: string, 
  phone?: string, 
  password?: string,
  age?: number,
  gender?: string
}) {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { role: true }
    })
    
    if (!user) {
      return { error: 'User not found', status: 404 }
    }

    // Hash password if provided
    let hashedPassword = undefined
    if (data.password) {
      hashedPassword = await hashPassword(data.password)
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update User table
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          phone: data.phone,
          password: hashedPassword,
        }
      })

      // 2. Update Role-specific table if Member
      if (user.role === 'MEMBER') {
        const memberData: any = {}
        if (data.age !== undefined) memberData.age = data.age
        if (data.gender) memberData.gender = data.gender

        if (Object.keys(memberData).length > 0) {
          await tx.member.update({
            where: { id: userId },
            data: memberData
          })
        }
      }

      // 3. Update Trainer specialization if ever added to dialog
      // (Not currently in the dialog for trainers themselves to edit, but extensible)

      return updatedUser
    })

    return { data: { success: true } }
  } catch (err) {
    console.error('[UpdateGenericProfile] Error:', err)
    return { error: 'Internal server error', status: 500 }
  }
}
