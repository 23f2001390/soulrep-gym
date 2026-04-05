import { prisma } from '../../shared/prisma'

/**
 * Fetches the entire billing history of the gym.
 * Shows the most recent transactions first so the owner can track 
 * cash flow easily from the dashboard.
 */
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

/**
 * Generates a new invoice/receipt for a member.
 * If the owner marks the invoice as 'PAID' immediately (offline cash payment), 
 * we automatically activate the member's plan and add their session credits.
 */
export async function createInvoice(invoiceData: any) {
  try {
    const { memberId, plan, status } = invoiceData
    
    // Default pricing logic: Basic 1499, Pro 2999, Elite 4999.
    // We allow an manual override if the owner gives a discount.
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

    // Workflow: If the member paid right now, skip the pending state 
    // and unlock their gym access immediately.
    if (status === 'PAID') {
      // Calculate how many PT sessions are included in this specific plan tier.
      const sessions = plan === 'MONTHLY' ? 0 : plan === 'QUARTERLY' ? 1 : 4;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // Standard 30-day billing cycle.
      
      await prisma.member.update({
        where: { id: memberId },
        data: {
          plan,
          planStatus: 'ACTIVE',
          planExpiry: expiryDate,
          // We increment instead of overwriting to keep any leftover credits from before.
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

