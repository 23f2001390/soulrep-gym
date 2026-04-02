import { prisma } from '../../shared/prisma'

export async function getInvoices() {
  try {
    const invoices = await prisma.invoice.findMany({
      select: {
        id: true,
        memberId: true,
        plan: true,
        amount: true,
        date: true,
        status: true,
        member: { include: { user: { select: { name: true } } } },
      },
      orderBy: { date: 'desc' }
    })
    return { data: invoices.map(inv => ({
      id: inv.id, memberId: inv.memberId, memberName: inv.member?.user?.name || 'Unknown',
      plan: inv.plan, amount: inv.amount, date: inv.date.toISOString().split('T')[0], status: inv.status
    }))}
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return { error: 'Failed to fetch invoices', status: 500 }
  }
}

export async function createInvoice(invoiceData: any) {
  try {
    const { memberId, plan, status } = invoiceData
    // Pricing logic standardized to 1499, 2999, 4999 (monthly cycles)
    const amount = invoiceData.amount ? parseFloat(invoiceData.amount.toString()) : 
                   plan === 'MONTHLY' ? 1499 : 
                   plan === 'QUARTERLY' ? 2999 : 4999;

    const invoice = await prisma.invoice.create({
      data: {
        memberId,
        plan,
        amount: Math.round(amount),
        date: invoiceData.date ? new Date(invoiceData.date) : new Date(),
        status: status || 'PENDING',
      },
    });

    // If invoice is PAID, activate the member immediately
    if (status === 'PAID') {
      const sessions = plan === 'MONTHLY' ? 0 : plan === 'QUARTERLY' ? 1 : 4;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // All plans are monthly focus
      
      await prisma.member.update({
        where: { id: memberId },
        data: {
          plan,
          planStatus: 'ACTIVE',
          planExpiry: expiryDate,
          sessionsRemaining: {
            increment: sessions
          }
        }
      });
    }

    return { data: invoice }
  } catch (error) {
    console.error('Error creating invoice:', error)
    return { error: 'Failed to create invoice', status: 500 }
  }
}
