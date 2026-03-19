import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/notifications
 * Returns all notifications for the current user.
 */
export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = (session.user as any).id
    console.log(`Fetching notifications for userId: ${userId}`)
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    return NextResponse.json(notifications)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

/**
 * PATCH /api/notifications
 * Marks a notification as read.
 */
export async function PATCH(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, readAll } = await req.json()

    if (readAll) {
      await prisma.notification.updateMany({
        where: { userId: (session.user as any).id, read: false },
        data: { read: true }
      })
    } else {
      await prisma.notification.update({
        where: { id, userId: (session.user as any).id },
        data: { read: true }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
