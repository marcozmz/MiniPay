import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exportInventoryCsv, filterProducts } from '../src/domain/catalog.ts';
import type { Product } from '../src/domain/inventory.ts';

const products: Product[] = [
  { id: 1, name: 'Café especial', code: '7890000000001', category: 'Mercearia', price: 1234, stock: 2, minimum: 3, storeId: 'jardim', version: 0, productVersion: 0 },
  { id: 2, name: '=Produto', code: '7890000000002', category: 'Bebidas', price: 500, stock: 9, minimum: 2, storeId: 'jardim', version: 0, productVersion: 0 },
];

test('filtros combinam busca, categoria e reposição', () => {
  assert.deepEqual(filterProducts(products, { query: 'CAFÉ', category: 'Mercearia', criticalOnly: true }).map(p => p.id), [1]);
  assert.deepEqual(filterProducts(products, { query: '0002', category: 'Bebidas', criticalOnly: false }).map(p => p.id), [2]);
  assert.equal(filterProducts(products, { query: 'inexistente', category: '', criticalOnly: false }).length, 0);
});

test('CSV da loja usa centavos, campos esperados e proteção contra fórmula', () => {
  const file = exportInventoryCsv(products, 'Loja Jardim');
  assert.equal(file.filename, 'estoque-loja-jardim.csv');
  assert(file.content.startsWith('\ufeff"Produto";'));
  assert(file.content.includes('"Café especial";"7890000000001";"Mercearia";"12,34";"2";"3"'));
  assert(file.content.includes('"\t=Produto"'));
});
