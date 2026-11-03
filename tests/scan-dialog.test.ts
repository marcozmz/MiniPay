import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { act, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CreateDialog } from '../src/CreateDialog';
import type { CodeLookup } from '../src/domain/scanning';

test('cadastro por leitura preserva zeros, exige foto e oferece captura ou arquivo', () => {
  const html = renderToStaticMarkup(createElement(CreateDialog, { kind: 'product', storeId: 'a', scan: { code: '00123456' }, onClose() {}, async onCreated() {} }));
  assert.match(html, /value="00123456"/); assert.match(html, /capture="environment"/); assert.match(html, /id="choose-photo"/); assert.match(html, /Foto obrigatória/);
  assert.match(html, /<button class="primary" disabled="">Cadastrar/);
});

test('fluxo interativo: permissão negada, alternativa manual, zero, catálogo e desconhecido', async t => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://scan.example.test' });
  const globals = ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'FormData', 'IS_REACT_ACT_ENVIRONMENT'] as const;
  const old = new Map(globals.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const key of globals) Object.defineProperty(globalThis, key, { configurable: true, value: key === 'IS_REACT_ACT_ENVIRONMENT' ? true : (dom.window as any)[key] });
  Object.defineProperty(dom.window, 'isSecureContext', { value: true });
  Object.defineProperty(dom.window.navigator, 'mediaDevices', { value: { async getUserMedia() { throw Object.assign(Error('Denied'), { name: 'NotAllowedError' }); } } });
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  const originalFetch = globalThis.fetch;
  const requests: { url: string; body?: any }[] = [];
  let response: CodeLookup = { kind: 'active', product: { id: 1, name: 'Produto antigo', code: '00123456', category: 'Doces', storeId: 'a', stock: 2, price: 1200, minimum: 1, version: 4, productVersion: 0, photoUrl: null } };
  let saves = 0;
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), ...(init?.body ? { body: JSON.parse(String(init.body)) } : {}) });
    return new Response(JSON.stringify(String(input).includes('/lookup') ? response : { replayed: false }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const { createRoot } = await import('react-dom/client');
  const { ScanStockDialog } = await import('../src/ScanStockDialog');
  const container = dom.window.document.getElementById('root')!;
  const root = createRoot(container);
  const render = async (key: string, role: 'admin' | 'operator' = 'admin') => act(async () => root.render(createElement(ScanStockDialog, { key, storeId: 'a', storeName: 'Loja A', role, onClose() {}, async onChanged() { saves++; } })));
  const click = async (label: string) => { const button = [...container.querySelectorAll('button')].find(b => b.textContent === label || b.getAttribute('aria-label') === label); assert(button, label); await act(async () => button.click()); };
  const setValue = async (selector: string, value: string) => { const input = container.querySelector<HTMLInputElement>(selector)!; assert(input, selector); await act(async () => { Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new dom.window.Event('input', { bubbles: true })); }); };
  const submit = async (selector: string) => act(async () => { const form = container.querySelector(selector)!; assert(form); form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); });
  const manual = async (value: string) => { await setValue('#manual-code', value); await submit('form'); };
  try {
    await t.test('nega câmera e permite buscar manualmente, com loja e zeros preservados', async () => {
      await render('manual'); await click('Abrir câmera');
      assert.match(container.textContent!, /Permissão da câmera negada/);
      await manual('00123456'); assert.equal(requests[0].url, '/api/products/lookup?storeId=a&code=00123456');
      assert.match(container.textContent!, /Foto pendente/); assert.match(container.textContent!, /Saldo consultado: 2 un/);
      await click('Aumentar quantidade'); assert.equal(container.querySelector<HTMLInputElement>('#count-quantity')!.value, '3');
      await click('Diminuir quantidade'); await setValue('#count-quantity', '0');
      await submit('form'); assert.equal(saves, 1);
      assert.equal(requests[1].url, '/api/adjustments'); assert.equal(requests[1].body.quantity, 0); assert.equal(requests[1].body.operation, 'count'); assert.equal(requests[1].body.expectedVersion, 4); assert.equal(requests[1].body.reason, '');
      await submit('form'); assert.equal(requests.length, 2); assert.match(container.textContent!, /Contagem registrada. Scanner pausado/);
    });
    await t.test('produto de outra loja oferece adicionar, reaproveita dados e não pede nova foto', async () => {
      response = { kind: 'catalog', product: { id: 2, name: 'Produto da rede', code: '00001234', category: 'Bebidas', productVersion: 0, photoUrl: '/api/products/2/photo?storeId=a' } };
      await render('catalog'); await manual('00001234'); await click('Adicionar à loja');
      assert.equal(container.querySelector<HTMLInputElement>('#new-name')!.value, 'Produto da rede'); assert(container.querySelector('img')); assert(!container.querySelector('#take-photo'));
      await setValue('#new-price', '12,90'); await setValue('#new-initial-stock', '5'); await setValue('#new-minimum', '2');
      await submit('form');
      const request = requests.find(r => r.url === '/api/products/from-scan')!; assert(request); assert.equal(request.body.code, '00001234'); assert.equal(request.body.name, 'Produto da rede'); assert.equal(request.body.category, 'Bebidas'); assert.equal(request.body.price, 1290); assert.equal(request.body.initialStock, 5); assert(!request.body.photo);
    });
    await t.test('desconhecido abre Novo produto com código preenchido e foto obrigatória', async () => {
      response = { kind: 'unknown', code: '00007777' }; await render('unknown'); await manual(response.code);
      assert.equal(container.querySelector('h2')!.textContent, 'Novo produto'); assert.equal(container.querySelector<HTMLInputElement>('#new-code')!.value, '00007777');
      assert(container.querySelector('#take-photo')); assert(container.querySelector('#choose-photo')); assert(container.querySelector<HTMLButtonElement>('button.primary')!.disabled);
    });
    await t.test('operador mantém contagem e encaminha cadastro ao administrador', async () => {
      await render('operator', 'operator'); await manual('00007777'); assert.match(container.textContent!, /Peça ao administrador/); assert(!container.querySelector('#new-code'));
    });
  } finally {
    await act(async () => root.unmount()); dom.window.close(); globalThis.fetch = originalFetch;
    for (const key of globals) { const descriptor = old.get(key); if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  }
});
