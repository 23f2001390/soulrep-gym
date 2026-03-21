import { inngest } from "../lib/inngest";
import { prisma } from "../backend/shared/prisma";
import { createNotification } from "../backend/services/notification.service";

/**
 * Background function to handle invoice generation.
 * This simulates a long-running process like generating a PDF and uploading it.
 */
export const generateInvoice = inngest.createFunction(
  { id: "generate-invoice", triggers: { event: "app/invoice.created" } },
  async ({ event, step }) => {
    const { invoiceId, memberId } = event.data;

    // 1. Simulate a long-running PDF generation
    await step.run("generate-pdf", async () => {
      console.log(`Generating PDF for invoice ${invoiceId}...`);
      // In a real scenario, you'd use a library like @react-pdf/renderer or puppeteer
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return { url: `https://gym.storage.com/invoices/${invoiceId}.pdf` };
    });

    // 2. Update the invoice in the database
    await step.run("update-invoice-status", async () => {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID", // Simulation: mark as paid after generation
        },
      });
      console.log(`Invoice ${invoiceId} marked as ready.`);
    });

    // 3. Send notification to member
    await step.run("send-notification", async () => {
      console.log(`Sending notification to member ${memberId}...`);
      await createNotification(
        memberId,
        "New Invoice Generated",
        `A new invoice #${invoiceId.slice(0, 8)} has been generated for your plan.`
      );
    });

    return { success: true, invoiceId };
  }
);
