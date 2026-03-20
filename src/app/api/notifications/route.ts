import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getNotifications, markAsRead } from '@/backend/services/notification.service'

/**
 * GET /api/notifications
 * Returns all notifications for the current user.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate() 
  if (auth.error) return auth.error

  const { data, error, status } = await getNotifications(auth.user.id)
  if (error) {
    return NextResponse.json({ error }, { status })
  }
  return NextResponse.json(data)
}

/**
 * PATCH /api/notifications
 * Marks a notification as read.
 */
export async function PATCH(req: NextRequest) {
  const auth = await authenticate()
  if (auth.error) return auth.error

  try {
    const { id, readAll } = await req.json()
    const result = await markAsRead(auth.user.id, id, readAll)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}

