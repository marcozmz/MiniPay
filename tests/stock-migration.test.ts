import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { openDatabase } from '../server/database';
import { createApp } from '../server/app';
import { seedWorkspace } from '../server/seed';

test('migração preserva contagens antigas, observação e conteúdo da requisição', async () => {
  const schema = 'test_' + randomUUID().replaceAll('-', '');
  let db = await openDatabase(schema);
  const { app, auth } = createApp(db, 'test-only-secret-do-not-use-in-production-123456789');
  try {
    const admin = await auth.api.signUpEmail({ body: { email: 'migration@example.test', password: 'test-password-12345', name: 'Admin teste' } });
    await seedWorkspace(db, admin.user.id);
    // Recreate the previous schema only inside this disposable test schema.
    await db.exec('ALTER TABLE movements DROP COLUMN operation, DROP COLUMN quantity_delta; DELETE FROM schema_migrations WHERE version>=5');
    const product = (await db.query("SELECT product_id FROM listings WHERE store_id='jardim' ORDER BY product_id LIMIT 1")).rows[0];
    const id = randomUUID();
    const originalRequest = JSON.stringify({ id, storeId: 'jardim', productId: product.product_id, expectedVersion: 0, stock: 4, reason: '', actor: admin.user.id });
    await db.query("INSERT INTO movements(id,network_id,store_id,product_id,actor_id,before_stock,after_stock,reason,request_json) VALUES($1,'demo','jardim',$2,$3,10,4,'',$4)", [id, product.product_id, admin.user.id, originalRequest]);
    const original = (await db.query('SELECT * FROM movements WHERE id=$1', [id])).rows[0];
    await db.close();
    db = await openDatabase(schema);
    const migrated = (await db.query('SELECT * FROM movements WHERE id=$1', [id])).rows[0];
    assert.deepEqual(migrated, { ...original, operation: 'count', quantity_delta: -6 });
    assert.equal((await db.query('SELECT version FROM schema_migrations WHERE version=5')).rows.length, 1);
    await db.close();
    db = await openDatabase(schema);
    assert.deepEqual((await db.query('SELECT * FROM movements WHERE id=$1', [id])).rows[0], migrated);
  } finally {
    await app.close();
    await db.dropTestSchema();
    await db.close();
  }
});
