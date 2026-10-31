import { test } from "node:test";
import assert from "node:assert/strict";
import { adjust, calculateStock, type StockOperation } from "../src/domain/inventory.ts";
const product = {
  id: 1,
  name: "Leite",
  code: "demo",
  category: "Mercearia" as const,
  productVersion: 0,
  price: 599,
  stock: 10,
  minimum: 3,
  storeId: "a",
  version: 0,
};
const state = {
  products: [product, { ...product, storeId: "b" }],
  history: [],
  listingHistory: [],
};
const change = {
  id: "adjust-1",
  at: "2026-10-28T12:00:00Z",
  product,
  operation: 'count' as const,
  quantity: 4,
  expectedVersion: 0,
  reason: "Contagem",
};
test("ajuste isolado por loja, sem mutação e com histórico", () => {
  const next = adjust(state, change);
  assert.equal(next.products[0].stock, 4);
  assert.equal(next.products[1].stock, 10);
  assert.equal(state.products[0].stock, 10);
  assert.equal(next.history[0].before, 10);
  assert.equal(next.history[0].after, 4);
  assert.equal(next.products[0].version, 1);
});
test("contagem desatualizada não sobrescreve outra alteração", () => {
  const next = adjust(state, change);
  assert.throws(
    () => adjust(next, { ...change, id: "adjust-2" }),
    /saldo mudou/,
  );
});
test("reenvio não duplica movimentação", () => {
  assert.throws(() => adjust(adjust(state, change), change), /já registrado/);
});
test("rejeita valores inválidos", () => {
  for (const stock of [-1, 1.5, NaN, Infinity])
    assert.throws(() =>
      adjust(state, { ...change, quantity: stock }),
    );
});
test("aceita motivo ausente, vazio ou espaços e preserva histórico sem justificativa inventada", () => {
  const { reason, ...withoutReason } = change;
  for (const input of [withoutReason, { ...change, reason: "" }, { ...change, reason: "  " }]) {
    const next = adjust(state, input);
    assert.equal(next.history[0].reason, "");
    assert.equal(next.history[0].at, change.at);
    assert.equal(next.history[0].before, 10);
    assert.equal(next.history[0].after, 4);
    assert.equal(next.products[1].stock, 10);
  }
  assert.equal(adjust(state, { ...change, reason: " Contagem " }).history[0].reason, reason);
});
test("não aceita loja inexistente", () => {
  assert.throws(
    () =>
      adjust(state, { ...change, product: { ...product, storeId: "other" } }),
    /não encontrado/,
  );
});

test('reposição, perda e contagem calculam o saldo e a diferença sem alterar outros campos', () => {
  for (const [operation, quantity, after, delta] of [
    ['replenishment', 3, 13, 3], ['loss', 3, 7, -3], ['loss', 10, 0, -10],
    ['count', 4, 4, -6], ['count', 15, 15, 5], ['count', 0, 0, -10], ['count', 10, 10, 0],
  ] as const) {
    const next = adjust(state, { ...change, operation, quantity });
    assert.equal(next.products[0].stock, after);
    assert.equal(next.products[0].price, product.price);
    assert.equal(next.products[0].minimum, product.minimum);
    assert.equal(next.history[0].operation, operation);
    assert.equal(next.history[0].delta, delta);
    assert.equal(next.products[1].stock, 10);
  }
});

test('rejeita perda sem saldo, excesso de reposição e quantidades inválidas', () => {
  assert.throws(() => calculateStock(10, 'loss', 11), /Saldo insuficiente/);
  assert.throws(() => calculateStock(999999, 'replenishment', 1), /ultrapassar/);
  for (const operation of ['replenishment', 'loss', 'count'] as StockOperation[]) {
    for (const quantity of [-1, 1.5, NaN, Infinity, 1000000])
      assert.throws(() => calculateStock(10, operation, quantity));
    if (operation !== 'count') assert.throws(() => calculateStock(10, operation, 0));
  }
});
