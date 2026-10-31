import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CreateDialog } from '../src/CreateDialog';
import { movementLabels, operationLabels } from '../src/domain/inventory';

test('cadastro mostra estoque inicial zero antes do mínimo e observação opcional', () => {
  const render = (kind: 'store' | 'product') => renderToStaticMarkup(createElement(CreateDialog, { kind, storeId: 'a', onClose() {}, async onCreated() {} }));
  const html = render('product');
  const stock = html.match(/<input\b[^>]*name="initialStock"[^>]*>/)?.[0];assert(stock);
  assert.match(stock, /value="0"/);assert.match(stock, /min="0"/);assert.match(stock, /max="999999"/);assert.match(stock, /step="1"/);
  assert(html.indexOf('Estoque inicial') < html.indexOf('Estoque mínimo'));
  assert.doesNotMatch(html, /começa com saldo zero/);
  const reason = html.match(/<input\b[^>]*name="reason"[^>]*>/)?.[0];assert(reason);assert.doesNotMatch(reason, /required/);
  assert.doesNotMatch(render('store'), /initialStock/);
  assert.equal(movementLabels.initial, 'Estoque inicial');assert.deepEqual(Object.keys(operationLabels), ['replenishment', 'loss', 'count']);
});
