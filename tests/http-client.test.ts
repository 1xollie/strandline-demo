import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ATTEMPTS, HttpError, requestJson, type Transport } from '../src/http-client.ts';

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

test('retries: 3 means three requests in total, the first attempt included', async () => {
  const t = scripted([503, 503, 200]);
  assert.deepEqual(await requestJson('http://x/a', { transport: t.transport, sleep: noSleep, retries: 3 }), {
    ok: true,
  });
  assert.equal(t.calls(), 3);
});

test('gives up with an HttpError once the attempts are used', async () => {
  const t = scripted([500]);
  await assert.rejects(
    requestJson('http://x/a', { transport: t.transport, sleep: noSleep, attempts: 2 }),
    (e: unknown) => e instanceof HttpError && e.status === 500,
  );
  assert.equal(t.calls(), 2);
});

test('attempts: 3 means three requests in total, the first attempt included', async () => {
  const t = scripted([503, 503, 200]);
  assert.deepEqual(await requestJson('http://x/a', { transport: t.transport, sleep: noSleep, attempts: 3 }), {
    ok: true,
  });
  assert.equal(t.calls(), 3);
});

test('the default is DEFAULT_ATTEMPTS (3) total requests', async () => {
  assert.equal(DEFAULT_ATTEMPTS, 3);
  const t = scripted([500]);
  await assert.rejects(requestJson('http://x/a', { transport: t.transport, sleep: noSleep }));
  assert.equal(t.calls(), DEFAULT_ATTEMPTS);
});

test('retries: 1 makes exactly one request and never retries', async () => {
  const t = scripted([500, 200]);
  await assert.rejects(requestJson('http://x/a', { transport: t.transport, sleep: noSleep, retries: 1 }));
  assert.equal(t.calls(), 1);
});

test('when both attempts and retries are given, attempts wins', async () => {
  const t = scripted([500, 500, 500, 500]);
  await assert.rejects(
    requestJson('http://x/a', { transport: t.transport, sleep: noSleep, attempts: 2, retries: 4 }),
  );
  assert.equal(t.calls(), 2);
});

test('does not retry client errors', async () => {
  const t = scripted([404]);
  await assert.rejects(requestJson('http://x/a', { transport: t.transport, sleep: noSleep }));
  assert.equal(t.calls(), 1);
});
