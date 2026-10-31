import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { installationHelp, registerPwa } from '../src/pwa';

test('manifesto standalone e ícones PNG nas dimensões declaradas', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.display, 'standalone');assert.equal(manifest.scope, '/');assert.equal(manifest.start_url, '/');
  assert(manifest.name.includes('MiniMercado'));assert(manifest.icons.some((icon: any) => icon.purpose.includes('maskable')));
  for (const icon of [...manifest.icons, { src: '/icons/apple-touch-icon.png', sizes: '180x180' }]) {
    const png = readFileSync(new URL('../public' + icon.src, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
});

test('instruções de instalação contemplam iPhone, iPad, Android, Safari e HTTPS', () => {
  assert.match(installationHelp('iPhone Safari', 1, true), /Safari.*Compartilhar.*Tela de Início/);
  assert.match(installationHelp('Macintosh Safari', 5, true), /iPad/);
  assert.match(installationHelp('Android Chrome', 1, true), /Android.*menu/);
  assert.match(installationHelp('Macintosh Safari', 0, true), /Dock/);
  assert.match(installationHelp('Windows Firefox', 0, true), /disponibilidade.*navegador/);
  assert.match(installationHelp('Android Chrome', 1, false), /HTTPS.*certificado válido/);
});

const workerSource = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
function worker() {
  const handlers: Record<string, (event: any) => void> = {};
  const stored = new Map<string, Response>();
  const removed: string[] = [];
  const fetches: { input: any; options: any }[] = [];
  let connected = true;
  const publicPage = '<h1>Sem conexão</h1>';
  runInNewContext(workerSource, {
    URL, Response,
    self: { location: { origin: 'https://test.example' }, addEventListener(name: string, handler: any) { handlers[name] = handler; }, skipWaiting() { assert.fail('Não antecipar atualização'); }, clients: { claim() { assert.fail('Não substituir páginas abertas'); } } },
    fetch: async (input: any, options: any) => {
      fetches.push({ input, options });
      if (!connected) throw new Error('offline');
      return new Response(input === '/offline.html' ? publicPage : 'conteúdo de rede', { headers: { 'Content-Type': 'text/html' } });
    },
    caches: {
      async open(name: string) { assert.equal(name, 'minimercado-offline-v1');return { async put(key: string, response: Response) { stored.set(key, response); }, async match(key: string) { return stored.get(key)?.clone(); } }; },
      async keys() { return ['private-unrelated-cache', 'minimercado-offline-v0', 'minimercado-offline-v1']; },
      async delete(name: string) { removed.push(name); },
    },
  });
  return { handlers, stored, fetches, removed, disconnect() { connected = false; } };
}

test('worker guarda somente a página pública e aguarda o fechamento das abas para atualizar', async () => {
  const w = worker();let pending!: Promise<void>;
  w.handlers.install({ waitUntil(promise: Promise<void>) { pending = promise; } });await pending;
  assert.deepEqual([...w.stored.keys()], ['/offline.html']);
  assert.equal(w.fetches[0].options.credentials, 'omit');
  w.handlers.activate({ waitUntil(promise: Promise<void>) { pending = promise; } });await pending;
  assert.deepEqual(w.removed, ['minimercado-offline-v0']);
  assert.equal(w.handlers.message, undefined);assert.equal(w.handlers.sync, undefined);
});

test('worker não intercepta API, autenticação, CSV, mutações, assets ou origens externas', () => {
  const w = worker();
  for (const [path, method, mode] of [
    ['/api', 'GET', 'navigate'], ['/api/workspace', 'GET', 'navigate'], ['/api/auth/get-session', 'GET', 'cors'],
    ['/api/export.csv?storeId=a', 'GET', 'navigate'], ['/api/adjustments', 'POST', 'cors'],
    ['/anything', 'POST', 'navigate'], ['/assets/main.js', 'GET', 'cors'], ['https://other.example/', 'GET', 'navigate'],
  ]) w.handlers.fetch({ request: { url: new URL(path, 'https://test.example').href, method, mode }, respondWith() { assert.fail('Requisição privada interceptada'); } });
  assert.equal(w.fetches.length, 0);assert.equal(w.stored.size, 0);
});

test('navegação usa rede sem cache e, indisponível, retorna somente aviso público', async () => {
  const w = worker();let pending!: Promise<void>;let response!: Promise<Response>;
  w.handlers.install({ waitUntil(promise: Promise<void>) { pending = promise; } });await pending;
  const event = { request: { url: 'https://test.example/', method: 'GET', mode: 'navigate' }, respondWith(promise: Promise<Response>) { response = promise; } };
  w.handlers.fetch(event);assert.equal(await (await response).text(), 'conteúdo de rede');
  assert.equal(w.fetches[1].options.cache, 'no-store');
  w.disconnect();w.handlers.fetch(event);assert.match(await (await response).text(), /Sem conexão/);
  assert.deepEqual([...w.stored.keys()], ['/offline.html']);
});

test('registro detecta atualização em espera e informa nova versão sem forçar ativação', async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const events: Record<string, () => void> = {};
  const workerEvents: Record<string, () => void> = {};
  let notices = 0;
  const installing = { state: 'installing', addEventListener(name: string, handler: () => void) { workerEvents[name] = handler; } };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { serviceWorker: {
    controller: {},
    async register(path: string, options: { scope: string; updateViaCache: string }) {
      assert.equal(path, '/sw.js');assert.deepEqual(options, { scope: '/', updateViaCache: 'none' });
      return { waiting: {}, installing, addEventListener(name: string, handler: () => void) { events[name] = handler; } };
    },
  } } });
  try {
    await registerPwa(() => notices++);assert.equal(notices, 1);
    events.updatefound();installing.state = 'installed';workerEvents.statechange();assert.equal(notices, 2);
    assert.equal(events.controllerchange, undefined);
  } finally {
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
    else Reflect.deleteProperty(globalThis, 'navigator');
  }
});
