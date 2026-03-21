import { prisma } from '../shared/prisma'

/**
 * Service to handle notification-related logic.
 */
export async function getNotifications(userId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    return { data: notifications }
  } catch (error) {
    return { error: 'Failed to fetch notifications', status: 500 }
  }
}

/**
 * Helper to create a notification.
 */
export async function createNotification(userId: string, title: string, message: string) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        read: false,
      }
    })
    return { data: notification }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { error: 'Failed to create notification', status: 500 }
  }
}

/**
 * Marks a notification as read.
 */
export async function markAsRead(userId: string, notificationId?: string, readAll: boolean = false) {
  try {
    if (readAll) {
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true }
      })
    } else if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId, userId },
        data: { read: true }
      })
    }
    return { success: true }
  } catch (error) {
    console.error('Error updating notification:', error)
    return { error: 'Failed to update notification', status: 500 }
  }
}
