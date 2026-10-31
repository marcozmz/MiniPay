import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { adjustmentSchema } from '../server/inventory';

const adjustment = { id: randomUUID(), storeId: 'a', productId: 1, expectedVersion: 0, operation: 'count', quantity: 4 };

test('servidor normaliza motivo ausente ou em branco sem inventar justificativa', () => {
 for (const operation of ['replenishment','loss','count']) {
  for (const input of [adjustment, { ...adjustment, reason: '' }, { ...adjustment, reason: ' \t ' }]) {
    assert.deepEqual(adjustmentSchema.parse({...input,operation}), { ...adjustment, operation, reason: '' });
  }
 }
  assert.equal(adjustmentSchema.parse({ ...adjustment, reason: ' Contagem ' }).reason, 'Contagem');
  assert.equal(adjustmentSchema.parse({ ...adjustment, reason: 'a'.repeat(200) }).reason.length, 200);
});

test('servidor mantém limite e tipo do motivo e validações do ajuste', () => {
  for (const reason of [null, 123, {}, 'a'.repeat(201)]) {
    assert.equal(adjustmentSchema.safeParse({ ...adjustment, reason }).success, false);
  }
  for (const invalid of [{ quantity: -1 }, { quantity: 1.5 }, { quantity: 1000000 }, { operation: 'sale' }, { operation: 'loss', quantity: 0 }, { operation: 'replenishment', quantity: 0 }, { stock: 1 }, { expectedVersion: -1 }, { actor: 'outro' }]) {
    assert.equal(adjustmentSchema.safeParse({ ...adjustment, ...invalid }).success, false);
  }
});
