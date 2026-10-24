import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exportInvoicesCsv, exportInvoicesJson } from '../src/export.ts';

test('writes a header and one line per invoice', () => {
  const csv = exportInvoicesCsv([
    { id: 'inv_1', customer: 'Acme', amountCents: 12050 },
    { id: 'inv_2', customer: 'Globex', amountCents: 999 },
  ]);
  assert.equal(csv, 'id,customer,amount\ninv_1,Acme,120.50\ninv_2,Globex,9.99\n');
});

test('csv quotes fields containing a comma', () => {
  const csv = exportInvoicesCsv([{ id: 'inv_3', customer: 'Smith, John', amountCents: 500 }]);
  assert.equal(csv, 'id,customer,amount\ninv_3,"Smith, John",5.00\n');
});

test('csv doubles inner double quotes and wraps the field', () => {
  const csv = exportInvoicesCsv([{ id: 'inv_4', customer: 'The "Best" Co', amountCents: 100 }]);
  assert.equal(csv, 'id,customer,amount\ninv_4,"The ""Best"" Co",1.00\n');
});

test('csv quotes fields containing a newline', () => {
  const csv = exportInvoicesCsv([{ id: 'inv_5', customer: 'Line1\nLine2', amountCents: 100 }]);
  assert.equal(csv, 'id,customer,amount\ninv_5,"Line1\nLine2",1.00\n');
});

test('csv leaves plain fields unquoted', () => {
  const csv = exportInvoicesCsv([{ id: 'inv_6', customer: 'Plain Name', amountCents: 100 }]);
  assert.equal(csv, 'id,customer,amount\ninv_6,Plain Name,1.00\n');
});

test('json writes pretty-printed invoices with amount in euros', () => {
  const json = exportInvoicesJson([
    { id: 'inv_1', customer: 'Acme', amountCents: 12050 },
    { id: 'inv_2', customer: 'Globex', amountCents: 999 },
  ]);
  assert.equal(
    json,
    [
      '[',
      '  {',
      '    "id": "inv_1",',
      '    "customer": "Acme",',
      '    "amount": 120.5',
      '  },',
      '  {',
      '    "id": "inv_2",',
      '    "customer": "Globex",',
      '    "amount": 9.99',
      '  }',
      ']',
    ].join('\n'),
  );
});

test('json of no invoices is an empty array', () => {
  assert.equal(exportInvoicesJson([]), '[]');
});
