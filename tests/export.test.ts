import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exportInvoicesCsv } from '../src/export.ts';

test('writes a header and one line per invoice', () => {
  const csv = exportInvoicesCsv([
    { id: 'inv_1', customer: 'Acme', amountCents: 12050 },
    { id: 'inv_2', customer: 'Globex', amountCents: 999 },
  ]);
  assert.equal(csv, 'id,customer,amount\ninv_1,Acme,120.50\ninv_2,Globex,9.99\n');
});
