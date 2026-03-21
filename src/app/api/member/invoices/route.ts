import { NextResponse, NextRequest } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { prisma } from '@/backend/shared/prisma'

/**
 * GET /api/member/invoices
 */
export async function GET(req: NextRequest) {
  const auth = await authenticate(['MEMBER'])
  if (auth.error) return auth.error

  try {
    const invoices = await prisma.invoice.findMany({
      where: { memberId: auth.user.id },
      orderBy: { date: 'desc' }
    })
    return NextResponse.json(invoices)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
