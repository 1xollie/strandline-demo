import { requestJson, type Transport } from './http-client.ts';

export interface BillingInvoice {
  id: string;
  customer: string;
  amountCents: number;
  status: string;
}

export interface PollOptions {
  transport?: Transport;
  sleep?: (ms: number) => Promise<void>;
}

/**
 * Fetch open invoices from the billing API. Relies on the client's default of three requests in total
 * (first attempt plus two retries) rather than passing `retries`, whose meaning changed in the client.
 */
export async function pollOpenInvoices(baseUrl: string, opts: PollOptions = {}): Promise<BillingInvoice[]> {
  const body = (await requestJson(`${baseUrl}/invoices?status=open`, {
    transport: opts.transport,
    sleep: opts.sleep,
  })) as { invoices: BillingInvoice[] };
  return body.invoices;
}
