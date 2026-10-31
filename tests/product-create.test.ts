import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { openDatabase } from '../server/database';
import { createApp } from '../server/app';
import { seedWorkspace } from '../server/seed';
import { productSchema } from '../server/inventory';

test('cadastro com estoque inicial: transação, isolamento, compatibilidade e reenvio', async t => {
  const schema = 'test_' + randomUUID().replaceAll('-', '');
  let db = await openDatabase(schema);
  const secret = 'test-only-secret-do-not-use-in-production-123456789';
  const origin = 'http://127.0.0.1:5174';
  let { app, auth } = createApp(db, secret, origin);
  try {
    const admin = await auth.api.signUpEmail({ body: { email: 'initial-admin@example.test', password: 'test-password-12345', name: 'Admin teste' } });
    await seedWorkspace(db, admin.user.id);
    const operator = await auth.api.signUpEmail({ body: { email: 'initial-operator@example.test', password: 'test-password-12345', name: 'Operador teste' } });
    await db.query("INSERT INTO memberships(user_id,network_id,role) VALUES($1,'demo','operator')", [operator.user.id]);
    await db.query("INSERT INTO store_access(network_id,user_id,store_id) VALUES('demo',$1,'jardim')", [operator.user.id]);
    const outsider = await auth.api.signUpEmail({ body: { email: 'initial-outsider@example.test', password: 'test-password-12345', name: 'Outra rede' } });
    await db.exec("INSERT INTO networks(id,name) VALUES('other','Outra rede')");
    await db.query("INSERT INTO memberships(user_id,network_id,role) VALUES($1,'other','admin')", [outsider.user.id]);
    const login = async (email: string) => {
      const response = await app.inject({ method: 'POST', url: '/api/auth/sign-in/email', headers: { origin }, payload: { email, password: 'test-password-12345' } });
      assert.equal(response.statusCode, 200);
      return response.cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    };
    const cookie = await login('initial-admin@example.test');
    const opCookie = await login('initial-operator@example.test');
    const otherCookie = await login('initial-outsider@example.test');
    const request = (url: string, body?: unknown, session = cookie) => app.inject({ method: body === undefined ? 'GET' : 'POST', url, headers: { origin, cookie: session, 'content-type': 'application/json' }, ...(body === undefined ? {} : { payload: JSON.stringify(body) }) });
    const snapshot = async () => (await request('/api/workspace')).json();
    const base = { storeId: 'jardim', name: 'Produto inicial', code: '7890000000300', category: 'Mercearia', price: 650, minimum: 3 };
    const positive = { ...base, id: randomUUID(), initialStock: 17, reason: '   ' };
    let productId = 0;

    await t.test('campo ausente mantém saldo zero; zero não inventa movimentação', async () => {
      for (const [index, stock] of [undefined, 0].entries()) {
        const input = { ...base, id: randomUUID(), code: `789000000030${index + 1}`, initialStock: stock };
        assert.equal((await request('/api/products', input)).statusCode, 201);
        const next = await snapshot();const product = next.products.find((p: any) => p.code === input.code);
        assert.equal(product.stock, 0);assert.equal(next.history.filter((h: any) => h.name === product.name).length, 0);
        const audit = next.listingHistory.find((h: any) => h.productId === product.id);
        assert.equal(audit.afterValues.stock, 0);assert.equal(audit.reason, '');
        assert.equal((await request('/api/products', { ...input, initialStock: 0, reason: '' })).json().replayed, true);
      }
      const legacy = { ...base, code: '7890000000303', reason: 'Cadastro antigo' };
      assert.equal((await request('/api/products', legacy)).statusCode, 201);
      assert.equal((await request('/api/products', legacy)).statusCode, 409);
      assert.equal((await snapshot()).products.find((p: any) => p.code === legacy.code).stock, 0);
    });

    await t.test('quantidade positiva registra saldo inicial com auditoria automática e motivo opcional', async () => {
      const response = await request('/api/products', positive);assert.equal(response.statusCode, 201);
      productId = response.json().id;
      const next = await snapshot();const product = next.products.find((p: any) => p.id === productId);
      assert.equal(product.stock, 17);assert.equal(product.storeId, 'jardim');
      const audit = next.history.find((h: any) => h.id === positive.id);
      assert.equal(audit.operation, 'initial');assert.equal(audit.before, 0);assert.equal(audit.after, 17);assert.equal(audit.delta, 17);
      assert.equal(audit.actor, 'Admin teste');assert.equal(audit.reason, '');assert(Number.isFinite(Date.parse(audit.at)));
      const stored = (await db.query('SELECT actor_id,reason,request_json FROM movements WHERE id=$1', [positive.id])).rows[0];
      assert.equal(stored.actor_id, admin.user.id);assert.equal(stored.reason, '');assert.equal(JSON.parse(stored.request_json).initialStock, 17);
      assert.equal(next.listingHistory.find((h: any) => h.productId === productId).afterValues.stock, 17);
    });

    await t.test('isola o saldo por loja e impede operador e outra rede', async () => {
      const before = await snapshot();
      assert.equal((await request('/api/products', { ...positive, id: randomUUID() }, opCookie)).statusCode, 403);
      assert.equal((await request('/api/products', { ...positive, id: randomUUID() }, otherCookie)).statusCode, 404);
      assert.deepEqual(await snapshot(), before);
      const second = { ...positive, id: randomUUID(), storeId: 'praca', initialStock: 4, reason: 'Entrada conferida' };
      assert.equal((await request('/api/products', second)).statusCode, 201);
      const next = await snapshot();
      assert.equal(next.products.find((p: any) => p.id === productId && p.storeId === 'praca').stock, 4);
      assert.equal(next.products.find((p: any) => p.id === productId && p.storeId === 'jardim').stock, 17);
      const op = (await request('/api/workspace', undefined, opCookie)).json();
      assert(op.history.every((h: any) => h.storeId === 'jardim'));
      assert.equal((await request('/api/workspace', undefined, otherCookie)).json().history.length, 0);
    });

    await t.test('rejeita quantidades inválidas sem cadastro ou histórico parcial', async () => {
      const before = await snapshot();
      for (const initialStock of [-1, 1.5, 1000000, null, '3', true, {}, NaN, Infinity]) {
        assert.equal(productSchema.safeParse({ ...positive, initialStock }).success, false);
        assert.equal((await request('/api/products', { ...positive, id: randomUUID(), code: '7890000000399', initialStock })).statusCode, 400);
      }
      assert.deepEqual(await snapshot(), before);
      assert.equal((await db.query("SELECT id FROM products WHERE code='7890000000399'")).rows.length, 0);
    });

    await t.test('primeiro envio simultâneo e reenvios sequenciais não duplicam o cadastro nem saldo', async () => {
      const input = { ...positive, id: randomUUID(), code: '7890000000304', initialStock: 9 };
      const before = await snapshot();
      const responses = await Promise.all([request('/api/products', input), request('/api/products', input)]);
      assert.deepEqual(responses.map(r => r.statusCode), [201, 201]);
      assert.deepEqual(responses.map(r => r.json().replayed).sort(), [false, true]);
      assert.equal(responses[0].json().id, responses[1].json().id);
      assert.equal((await request('/api/products', input)).json().replayed, true);
      for (const changed of [{ initialStock: 12 }, { reason: 'Outro motivo' }, { code: '7890000000305' }])
        assert.equal((await request('/api/products', { ...input, ...changed })).statusCode, 409);
      const next = await snapshot();
      assert.equal(next.products.length, before.products.length + 1);assert.equal(next.history.length, before.history.length + 1);assert.equal(next.listingHistory.length, before.listingHistory.length + 1);
      assert.equal(next.products.find((p: any) => p.code === input.code).stock, 9);
    });

    await t.test('falha ao gravar movimento reverte catálogo, saldo e histórico juntos', async () => {
      const before = await snapshot();
      await db.exec("ALTER TABLE movements ADD CONSTRAINT test_initial_failure CHECK (reason <> 'forced-failure')");
      try {
        const failed = { ...positive, id: randomUUID(), code: '7890000000306', reason: 'forced-failure' };
        assert.equal((await request('/api/products', failed)).statusCode, 500);
        assert.equal((await db.query('SELECT id FROM products WHERE code=$1', [failed.code])).rows.length, 0);
        assert.deepEqual(await snapshot(), before);
      } finally { await db.exec('ALTER TABLE movements DROP CONSTRAINT test_initial_failure'); }
    });

    await t.test('reenvio após movimentação e reinício preserva o saldo atual e os históricos anteriores', async () => {
      assert.equal((await request('/api/adjustments', { id: randomUUID(), productId, storeId: 'jardim', expectedVersion: 0, operation: 'replenishment', quantity: 3 })).statusCode, 200);
      const saved = await snapshot();
      await app.close();await db.close();db = await openDatabase(schema);({ app, auth } = createApp(db, secret, origin));
      assert.equal((await request('/api/products', positive)).json().replayed, true);
      assert.deepEqual(await snapshot(), saved);
      assert.equal(saved.products.find((p: any) => p.id === productId && p.storeId === 'jardim').stock, 20);
    });

    await t.test('nomes UTF-8 persistem e recarregam íntegros; entrada Latin-1 e substituições são recusadas', async () => {
      const before = (await snapshot()).stores.length;
      for (const name of ['Loja comparação UTF-8', 'Loja validação UTF-8']) {
        const response = await app.inject({ method: 'POST', url: '/api/stores', headers: { origin, cookie, 'content-type': 'application/json; charset=utf-8' }, payload: Buffer.from(JSON.stringify({ name }), 'utf8') });
        assert.equal(response.statusCode, 201);
        const id = response.json().id;
        assert.equal((await db.query('SELECT name FROM stores WHERE id=$1', [id])).rows[0].name, name);
        assert.equal((await snapshot()).stores.find((s: any) => s.id === id).name, name);
      }
      const malformed = await app.inject({ method: 'POST', url: '/api/stores', headers: { origin, cookie, 'content-type': 'application/json' }, payload: Buffer.from(JSON.stringify({ name: 'Loja comparação Latin-1' }), 'latin1') });
      assert.equal(malformed.statusCode, 400);
      assert.equal((await request('/api/stores', { name: 'Loja valida\uFFFD\uFFFDo' })).statusCode, 400);
      assert.equal((await snapshot()).stores.length, before + 2);
    });
  } finally { await app.close();await db.dropTestSchema();await db.close(); }
});
