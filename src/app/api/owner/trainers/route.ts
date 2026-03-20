import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getTrainers } from '@/backend/services/trainer.service'

/**
 * GET /api/owner/trainers
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error
  
  const result = await getTrainers()
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}