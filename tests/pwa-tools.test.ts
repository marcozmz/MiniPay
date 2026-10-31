import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PwaTools } from '../src/PwaTools';

test('sem oferta nativa mostra instrução, standalone oculta instalação e offline informa indisponibilidade', () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  let online = true;let installed = false;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { isSecureContext: true, matchMedia() { return { matches: installed }; } } });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { userAgent: 'iPhone Safari', maxTouchPoints: 1, get onLine() { return online; } } });
  try {
    const render = () => renderToStaticMarkup(createElement(PwaTools, { authenticated: true }));
    const help = render();assert.match(help, /<summary>Como instalar/);assert.match(help, /Compartilhar/);assert.doesNotMatch(help, /<button/);
    installed = true;assert.equal(render(), '');
    online = false;const offline = render();assert.match(offline, /role="alert"/);assert.match(offline, /nenhuma alteração será enfileirada/);assert.doesNotMatch(offline, /<button|<summary/);
  } finally {
    for (const [name, descriptor] of [['navigator', originalNavigator], ['window', originalWindow]] as const) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});
