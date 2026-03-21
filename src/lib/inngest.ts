import { Inngest } from "inngest";

// Define the event types locally for use in functions
export type InngestEvents = {
  "app/invoice.created": {
    data: {
      invoiceId: string;
      memberId: string;
    }
  }
}

// Create a client to send and receive events
// Using any for the generic to avoid version-specific schema issues in this environment
export const inngest = new Inngest({ id: "soulrep-gym" });
