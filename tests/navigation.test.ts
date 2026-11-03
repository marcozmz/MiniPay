import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Navigation, navigationItems } from '../src/Navigation';

test('navegação única por perfil e indicação acessível da seção ativa', () => {
  for (const role of ['admin', 'operator'] as const) {
    for (const view of ['inventory', 'history', 'stores'] as const) {
      const html = renderToStaticMarkup(createElement(Navigation, { role, view, onNavigate() {} }));
      assert.equal((html.match(/<nav\b/g) ?? []).length, 1);
      assert.equal((html.match(/<button\b/g) ?? []).length, role === 'admin' ? 5 : 3);
      assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
      assert.equal(html.includes('Operadores'), role === 'admin');
      assert.equal(html.includes('Dashboard'), role === 'admin');
      for (const item of navigationItems.filter(item => !item.adminOnly || role === 'admin')) assert(html.includes(item.label));
      assert.equal((html.match(/<svg aria-hidden="true"/g) ?? []).length, role === 'admin' ? 5 : 3);
    }
  }
  const admin = renderToStaticMarkup(createElement(Navigation, { role: 'admin', view: 'users', onNavigate() {} }));
  assert.match(admin, /aria-current="page"[^>]*>.*Operadores/s);
});
