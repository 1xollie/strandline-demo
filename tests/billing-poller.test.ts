import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pollOpenInvoices } from '../src/billing-poller.ts';
import type { Transport } from '../src/http-client.ts';

const noSleep = async () => {};

const invoices = [
  { id: 'inv_1', customer: 'acme', amountCents: 12000, status: 'open' },
  { id: 'inv_2', customer: 'globex', amountCents: 4500, status: 'open' },
];

function scripted(responses: { status: number; body: unknown }[]): { transport: Transport; calls: () => number } {
  let n = 0;
  return {
    transport: async () => {
      const res = responses[Math.min(n, responses.length - 1)];
      n++;
      return res;
    },
    calls: () => n,
  };
}

test('returns the open invoices after two 503s, making three requests', async () => {
  const t = scripted([
    { status: 503, body: null },
    { status: 503, body: null },
    { status: 200, body: { invoices } },
  ]);
  assert.deepEqual(await pollOpenInvoices('http://billing', { transport: t.transport, sleep: noSleep }), invoices);
  assert.equal(t.calls(), 3);
});

test('rejects when the billing API keeps answering 503, after three requests', async () => {
  const t = scripted([{ status: 503, body: null }]);
  await assert.rejects(pollOpenInvoices('http://billing', { transport: t.transport, sleep: noSleep }));
  assert.equal(t.calls(), 3);
});
