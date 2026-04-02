import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { confirmBooking, completeBooking } from '@/backend/services/trainer.service'

/**
 * PATCH /api/trainer/bookings/[bookingId]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const auth = await authenticate(['TRAINER'])
  if (auth.error) return auth.error

  const { bookingId } = await params
  const { action, notes } = await req.json()

  try {
    let result: any
    if (action === 'CONFIRM') {
      result = await confirmBooking(auth.user.id, bookingId)
    } else if (action === 'COMPLETE') {
      result = await completeBooking(auth.user.id, bookingId, notes)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json(result.data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
