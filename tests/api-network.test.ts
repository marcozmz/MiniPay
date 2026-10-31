import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, downloadCsv } from '../src/api';

test('cliente não envia nem enfileira requisições offline e não usa cache da API/CSV', async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const originalFetch = globalThis.fetch;
  let online = false;const calls: { input: unknown; options: RequestInit | undefined }[] = [];
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { get onLine() { return online; } } });
  globalThis.fetch = async (input, options) => {
    calls.push({ input, options });
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  };
  try {
    await assert.rejects(api('/adjustments', { id: 'example' }), /Sem conexão.*nenhuma alteração será enfileirada/);
    await assert.rejects(downloadCsv('a'), /Sem conexão/);assert.equal(calls.length, 0);
    online = true;
    assert.deepEqual(await api('/workspace'), { ok: true });
    await api('/adjustments', { id: 'example' });await downloadCsv('a');
    assert.equal(calls.length, 3);
    assert(calls.every(call => call.options?.cache === 'no-store' && call.options.credentials === 'same-origin'));
    globalThis.fetch = async () => { throw new Error('network'); };
    await assert.rejects(api('/adjustments', { id: 'example' }), /Não foi possível confirmar.*histórico/);
    assert.equal(calls.length, 3);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
    else Reflect.deleteProperty(globalThis, 'navigator');
  }
});
