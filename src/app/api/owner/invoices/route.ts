import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { getInvoices, createInvoice } from '@/backend/services/owner.service'

/**
 * POST /api/owner/invoices
 */
export async function POST(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error
  
  try {
    const data = await req.json()
    const result = await createInvoice(data)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json(result.data)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

/**
 * GET /api/owner/invoices
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['OWNER'])
  if (auth.error) return auth.error
  
  const result = await getInvoices()
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}