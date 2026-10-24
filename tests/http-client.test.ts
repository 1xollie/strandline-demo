import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HttpError, requestJson, type Transport } from '../src/http-client.ts';

const noSleep = async () => {};

function scripted(statuses: number[]): { transport: Transport; calls: () => number } {
  let n = 0;
  return {
    transport: async () => {
      const status = statuses[Math.min(n, statuses.length - 1)];
      n++;
      return { status, body: { ok: status < 400 } };
    },
    calls: () => n,
  };
}

test('returns the body of a successful request', async () => {
  const t = scripted([200]);
  assert.deepEqual(await requestJson('http://x/a', { transport: t.transport }), { ok: true });
  assert.equal(t.calls(), 1);
});

test('retries: 2 means the first attempt plus two more, three requests at most', async () => {
  const t = scripted([503, 503, 200]);
  assert.deepEqual(await requestJson('http://x/a', { transport: t.transport, sleep: noSleep, retries: 2 }), {
    ok: true,
  });
  assert.equal(t.calls(), 3);
});

test('gives up with an HttpError once the retries are used', async () => {
  const t = scripted([500]);
  await assert.rejects(
    requestJson('http://x/a', { transport: t.transport, sleep: noSleep, retries: 1 }),
    (e: unknown) => e instanceof HttpError && e.status === 500,
  );
  assert.equal(t.calls(), 2);
});

test('does not retry client errors', async () => {
  const t = scripted([404]);
  await assert.rejects(requestJson('http://x/a', { transport: t.transport, sleep: noSleep }));
  assert.equal(t.calls(), 1);
});
