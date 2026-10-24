export interface Invoice {
  id: string;
  customer: string;
  amountCents: number;
}

/** One CSV line per invoice, after a header line. */
export function exportInvoicesCsv(invoices: Invoice[]): string {
  const lines = invoices.map((i) => `${i.id},${i.customer},${(i.amountCents / 100).toFixed(2)}`);
  return ['id,customer,amount', ...lines].join('\n') + '\n';
}
