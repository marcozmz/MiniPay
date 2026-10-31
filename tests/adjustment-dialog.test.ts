import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdjustmentDialog } from '../src/AdjustmentDialog';

test('formulário de estoque permite motivo vazio e mantém quantidade obrigatória', () => {
  const html = renderToStaticMarkup(createElement(AdjustmentDialog, {
    product: { id: 1, name: 'Produto teste', code: '7890000000001', category: 'Mercearia', productVersion: 0, price: 599, stock: 10, minimum: 3, storeId: 'a', version: 0 },
    onClose: () => {},
    onSave: async () => {},
  }));
  const reason = html.match(/<input\b[^>]*name="reason"[^>]*>/)?.[0];
  const stock = html.match(/<input\b[^>]*name="quantity"[^>]*>/)?.[0];
  assert(reason); assert(stock);
  assert.doesNotMatch(reason, /\brequired=/);
  assert.match(reason, /maxLength="200"/);
  assert.match(stock, /\brequired=/);
  for (const label of ['Reposição', 'Perda', 'Contagem']) assert(html.includes(label));
  assert.match(html, /Saldo ao abrir: 10/);
  assert.match(html, /Observação \(opcional\)/);
});
