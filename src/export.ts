export interface Invoice {
  id: string;
  customer: string;
  amountCents: number;
}

/** Wraps a field in double quotes when it contains a comma, double quote or newline. */
function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** One CSV line per invoice, after a header line. */
export function exportInvoicesCsv(invoices: Invoice[]): string {
  const lines = invoices.map(
    (i) => `${csvField(i.id)},${csvField(i.customer)},${(i.amountCents / 100).toFixed(2)}`,
  );
  return ['id,customer,amount', ...lines].join('\n') + '\n';
}

/** Pretty-printed JSON array; `amount` is in euros as a number. */
export function exportInvoicesJson(invoices: Invoice[]): string {
  const rows = invoices.map((i) => ({ id: i.id, customer: i.customer, amount: i.amountCents / 100 }));
  return JSON.stringify(rows, null, 2);
}
