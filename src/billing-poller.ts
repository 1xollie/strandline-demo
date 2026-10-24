import { requestJson, type Transport } from './http-client.ts';

export interface BillingInvoice {
  id: string;
  customer: string;
  amountCents: number;
  status: string;
}

interface OpenInvoicesBody {
  invoices: BillingInvoice[];
}

/**
 * Fetch open invoices from the billing API. Relies on the client's default attempt count (3 requests
 * in total), which is the same in both client versions; `retries` is not passed because its meaning changed.
 */
export async function pollOpenInvoices(
  baseUrl: string,
  opts: { transport?: Transport; sleep?: (ms: number) => Promise<void> } = {},
): Promise<BillingInvoice[]> {
  const body = (await requestJson(`${baseUrl}/invoices?status=open`, {
    transport: opts.transport,
    sleep: opts.sleep,
  })) as OpenInvoicesBody;
  return body.invoices;
}
