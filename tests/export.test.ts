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

test('quotes fields containing commas, double quotes or newlines', () => {
  const csv = exportInvoicesCsv([
    { id: 'inv_3', customer: 'Smith, Jones & Co', amountCents: 500 },
    { id: 'inv_4', customer: 'The "Best" Shop', amountCents: 100 },
    { id: 'inv_5', customer: 'Line one\nLine two', amountCents: 200 },
  ]);
  assert.equal(
    csv,
    'id,customer,amount\n' +
      'inv_3,"Smith, Jones & Co",5.00\n' +
      'inv_4,"The ""Best"" Shop",1.00\n' +
      'inv_5,"Line one\nLine two",2.00\n',
  );
});

test('leaves fields without special characters unquoted', () => {
  const csv = exportInvoicesCsv([{ id: 'inv_6', customer: 'Acme GmbH', amountCents: 1 }]);
  assert.equal(csv, 'id,customer,amount\ninv_6,Acme GmbH,0.01\n');
});

test('writes pretty-printed JSON with amount in euros', () => {
  const json = exportInvoicesJson([
    { id: 'inv_1', customer: 'Acme', amountCents: 12050 },
    { id: 'inv_2', customer: 'Globex', amountCents: 999 },
  ]);
  assert.equal(
    json,
    '[\n' +
      '  {\n' +
      '    "id": "inv_1",\n' +
      '    "customer": "Acme",\n' +
      '    "amount": 120.5\n' +
      '  },\n' +
      '  {\n' +
      '    "id": "inv_2",\n' +
      '    "customer": "Globex",\n' +
      '    "amount": 9.99\n' +
      '  }\n' +
      ']',
  );
});

test('exports an empty list as an empty JSON array', () => {
  assert.equal(exportInvoicesJson([]), '[]');
});
