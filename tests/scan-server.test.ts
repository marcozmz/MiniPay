import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { openDatabase } from '../server/database';
import { createApp } from '../server/app';
import { seedWorkspace } from '../server/seed';
import { preparePhoto, photoSchema } from '../server/photos';
import { maxPhotoBytes } from '../src/domain/scanning';

test('fotos validam bytes, formato real e pixels e removem metadados', async () => {
  for (const format of ['jpeg', 'png', 'webp'] as const) {
    const image = await sharp({ create: { width: 32, height: 24, channels: 3, background: '#229944' } }).toFormat(format).withMetadata().toBuffer();
    const prepared = await preparePhoto({ mime: `image/${format}`, data: image.toString('base64') });
    const meta = await sharp(prepared).metadata(); assert.equal(meta.format, 'jpeg'); assert(!meta.exif); assert(!meta.icc);
    await assert.rejects(preparePhoto({ mime: format === 'png' ? 'image/jpeg' : 'image/png', data: image.toString('base64') }));
    await assert.rejects(preparePhoto({ mime: `image/${format}`, data: image.subarray(0, image.length / 2).toString('base64') }));
  }
  await assert.rejects(preparePhoto({ mime: 'image/png', data: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>').toString('base64') }));
  assert(!photoSchema.safeParse({ mime: 'image/svg+xml', data: 'AAAA' }).success);
  assert(!photoSchema.safeParse({ mime: 'image/png', data: 'not base64' }).success);
  assert(!photoSchema.safeParse({ mime: 'image/png', data: Buffer.alloc(maxPhotoBytes + 1).toString('base64') }).success);
  const huge = await sharp({ create: { width: 4001, height: 4000, channels: 3, background: 'white' } }).png().toBuffer();
  await assert.rejects(preparePhoto({ mime: 'image/png', data: huge.toString('base64') }));
});

test('scanner: catálogo comum, foto persistente, permissões, contagem e reenvios', async t => {
  const schema = 'test_' + randomUUID().replaceAll('-', '');
  let db = await openDatabase(schema);
  const origin = 'http://127.0.0.1:5174', secret = 'test-only-secret-do-not-use-in-production-123456789';
  let { app, auth } = createApp(db, secret, origin);
  try {
    const admin = await auth.api.signUpEmail({ body: { email: 'scan-admin@example.test', password: 'test-password-12345', name: 'Admin scanner' } });
    await seedWorkspace(db, admin.user.id);
    const operator = await auth.api.signUpEmail({ body: { email: 'scan-operator@example.test', password: 'test-password-12345', name: 'Operador scanner' } });
    await db.query("INSERT INTO memberships(user_id,network_id,role) VALUES($1,'demo','operator')", [operator.user.id]);
    await db.query("INSERT INTO store_access(network_id,user_id,store_id) VALUES('demo',$1,'jardim')", [operator.user.id]);
    const other = await auth.api.signUpEmail({ body: { email: 'scan-other@example.test', password: 'test-password-12345', name: 'Outra rede' } });
    await db.exec("INSERT INTO networks(id,name) VALUES('other','Outra rede'); INSERT INTO franchisees(id,network_id,name) VALUES('other','other','Outro franqueado'); INSERT INTO stores(id,network_id,franchisee_id,name) VALUES('other','other','other','Outra loja'); INSERT INTO products(network_id,name,code,category) VALUES('other','Produto privado','00999999','Doces')");
    await db.query("INSERT INTO memberships(user_id,network_id,role) VALUES($1,'other','admin')", [other.user.id]);
    const login = async (email: string) => {
      const r = await app.inject({ method: 'POST', url: '/api/auth/sign-in/email', headers: { origin }, payload: { email, password: 'test-password-12345' } });
      assert.equal(r.statusCode, 200); return r.cookies.map(c => `${c.name}=${c.value}`).join('; ');
    };
    const cookie = await login('scan-admin@example.test'), op = await login('scan-operator@example.test'), outsider = await login('scan-other@example.test');
    const request = (url: string, body?: unknown, session = cookie) => app.inject({ method: body === undefined ? 'GET' : 'POST', url, headers: { origin, cookie: session, ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, ...(body === undefined ? {} : { payload: JSON.stringify(body) }) });
    const lookup = (code: string, store = 'jardim', session = cookie) => request(`/api/products/lookup?storeId=${store}&code=${code}`, undefined, session);
    const image = await sharp({ create: { width: 40, height: 40, channels: 3, background: 'green' } }).png().toBuffer();
    const body = { id: randomUUID(), storeId: 'praca', code: '00123456', name: 'Produto com foto', category: 'Doces', price: 1234, minimum: 2, initialStock: 5, photo: { mime: 'image/png', data: image.toString('base64') } };
    let productId = 0;
    await t.test('encontrado na loja mostra saldo e antigos sem foto continuam disponíveis', async () => {
      const r = (await lookup('7890000000001', 'jardim', op)).json();
      assert.equal(r.kind, 'active'); assert.equal(r.product.storeId, 'jardim'); assert.equal(r.product.photoUrl, null); assert.equal(typeof r.product.version, 'number');
      assert.equal((await lookup('00999999')).json().kind, 'unknown');
      assert.equal((await lookup('00123456')).json().code, '00123456');
      assert.equal((await lookup('123')).statusCode, 400);
    });
    await t.test('foto obrigatória no fluxo e recusas sem efeitos parciais', async () => {
      assert.equal((await request('/api/products/from-scan', { ...body, photo: undefined })).statusCode, 400);
      assert.equal((await request('/api/products/from-scan', { ...body, photo: { mime: 'image/png', data: 'AAAA' } })).statusCode, 400);
      assert.equal((await lookup(body.code, 'praca')).json().kind, 'unknown');
      assert.equal((await request('/api/products/from-scan', body, op)).statusCode, 403);
      const huge = await request('/api/products/from-scan', { ...body, photo: { mime: 'image/png', data: 'A'.repeat(4 * 1024 * 1024 + 20000) } }); assert.equal(huge.statusCode, 413);
    });
    await t.test('cadastro repetido é idempotente e não duplica foto nem movimento', async () => {
      const results = await Promise.all([request('/api/products/from-scan', body), request('/api/products/from-scan', body)]);
      assert(results.every(r => r.statusCode === 201)); assert.deepEqual(results.map(r => r.json().replayed).sort(), [false, true]);
      productId = results[0].json().id;
      assert.equal((await lookup(body.code, 'praca')).json().product.code, body.code);
      assert.equal((await db.query('SELECT * FROM product_photos WHERE product_id=$1', [productId])).rows.length, 1);
      const audit = (await db.query('SELECT request_json,after_values FROM listing_changes WHERE product_id=$1', [productId])).rows[0];
      assert(!audit.request_json.includes(image.toString('base64'))); assert.equal(audit.after_values.photo, true);
      assert.equal((await db.query('SELECT * FROM movements WHERE product_id=$1', [productId])).rows.length, 1);
      assert.equal((await request('/api/products/from-scan', { ...body, minimum: 9 })).statusCode, 409);
    });
    await t.test('produto só de outra loja expõe catálogo sem saldo/preço e reutiliza cadastro e foto', async () => {
      const r = (await lookup(body.code, 'jardim', op)).json(); assert.equal(r.kind, 'catalog');
      assert.equal(r.product.name, body.name); assert.equal(r.product.id, productId); assert(!('stock' in r.product)); assert(!('price' in r.product));
      assert(r.product.photoUrl.endsWith('storeId=jardim'));
      assert.equal((await lookup(body.code, 'praca', op)).statusCode, 404);
      assert.equal((await lookup(body.code, 'other', outsider)).json().kind, 'unknown');
      const include = { ...body, id: randomUUID(), storeId: 'jardim', photo: undefined, price: 999, initialStock: 7, minimum: 1 };
      assert.equal((await request('/api/products/from-scan', include)).statusCode, 201);
      assert.equal((await request('/api/products/from-scan', include)).json().replayed, true);
      assert.equal((await lookup(body.code)).json().product.stock, 7); assert.equal((await lookup(body.code, 'praca')).json().product.stock, 5);
      const photos = (await db.query('SELECT * FROM product_photos WHERE product_id=$1', [productId])).rows; assert.equal(photos.length, 1);
    });
    await t.test('foto exige sessão, rede e loja autorizada e não entra em cache', async () => {
      const url = `/api/products/${productId}/photo?storeId=jardim`;
      assert.equal((await app.inject({ url })).statusCode, 401);
      assert.equal((await request(url, undefined, outsider)).statusCode, 404);
      assert.equal((await request(`/api/products/${productId}/photo?storeId=other`, undefined, outsider)).statusCode, 404);
      assert.equal((await request(`/api/products/${productId}/photo?storeId=praca`, undefined, op)).statusCode, 404);
      const r = await request(url, undefined, op); assert.equal(r.statusCode, 200); assert.equal(r.headers['content-type'], 'image/jpeg'); assert.match(String(r.headers['cache-control']), /private, no-store/); assert.equal((await sharp(r.rawPayload).metadata()).format, 'jpeg');
      await db.query('DELETE FROM store_access WHERE user_id=$1', [operator.user.id]);
      assert.equal((await request(url, undefined, op)).statusCode, 404);
      await db.query("INSERT INTO store_access(network_id,user_id,store_id) VALUES('demo',$1,'jardim')", [operator.user.id]);
    });
    await t.test('contagem zero opcional auditada, leitura/reenvio repetido e conflito não sobrescrevem', async () => {
      const p = (await lookup(body.code, 'jardim', op)).json().product;
      const adjustment = { id: randomUUID(), storeId: 'jardim', productId: p.id, expectedVersion: p.version, operation: 'count', quantity: 0 };
      const results = await Promise.all([request('/api/adjustments', adjustment, op), request('/api/adjustments', adjustment, op)]);
      assert(results.every(r => r.statusCode === 200)); assert.deepEqual(results.map(r => r.json().replayed).sort(), [false, true]);
      assert.equal((await request('/api/adjustments', { ...adjustment, id: randomUUID(), quantity: 8 }, op)).statusCode, 409);
      const movement = (await db.query('SELECT * FROM movements WHERE id=$1', [adjustment.id])).rows[0]; assert.equal(movement.actor_id, operator.user.id); assert.equal(movement.reason, ''); assert.equal(movement.before_stock, 7); assert.equal(movement.after_stock, 0); assert.equal(movement.operation, 'count'); assert(movement.at);
      assert.equal((await lookup(body.code)).json().product.stock, 0); assert.equal((await lookup(body.code, 'praca')).json().product.stock, 5);
    });
    await t.test('foto e código persistem após reabrir banco e servidor', async () => {
      await app.close(); await db.close(); db = await openDatabase(schema, { migrate: false }); ({ app, auth } = createApp(db, secret, origin));
      const result = (await lookup(body.code)).json(); assert.equal(result.product.code, '00123456'); assert.equal(result.product.stock, 0);
      assert.equal((await request(result.product.photoUrl)).statusCode, 200);
    });
  } finally { await app.close(); await db.dropTestSchema(); await db.close(); }
});
