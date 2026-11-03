import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Dashboard } from '../src/Dashboard';
import { Navigation, navigationItems } from '../src/Navigation';

test('dashboard prepara filtros e análises sem inventar resultados de vendas', () => {
  const html = renderToStaticMarkup(createElement(Dashboard, { stores: [{ id: 'store-a', name: 'Loja A' }] }));
  for (const label of ['Período', 'Hoje', 'Últimos 7 dias', 'Mês atual', 'Personalizado', 'Todas as lojas', 'Loja A', 'Faturamento', 'Ticket médio', 'Mix de produtos', 'Vendas por período', 'Formas de pagamento', 'Ranking de produtos', 'Ranking de lojas', 'Ranking de categorias', 'Curva ABC', 'margem', 'markup']) assert(html.includes(label), label);
  assert.match(html, /Ainda não há dados de vendas/);
  assert.match(html, /Margem e markup dependem do cadastro de custos/);
  assert.doesNotMatch(html, /R\$|<svg|<canvas|\d+%/);
  assert.doesNotThrow(() => renderToStaticMarkup(createElement(Dashboard, { stores: [] })));
});

test('dashboard só aparece na navegação administrativa com seção ativa', () => {
  for (const role of ['admin', 'operator'] as const) {
    const html = renderToStaticMarkup(createElement(Navigation, { role, view: 'dashboard', onNavigate() {} }));
    assert.equal(html.includes('Dashboard'), role === 'admin');
    assert.equal(html.includes('aria-current="page"'), role === 'admin');
  }
  assert.equal(navigationItems.find(item => item.id === 'dashboard')?.adminOnly, true);
});
