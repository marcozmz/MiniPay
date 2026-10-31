import assert from 'node:assert/strict';
import test from 'node:test';
import { createValidationDatabaseName, isSafeDatabaseName } from '../scripts/backup-names.mjs';

test('nome gerado para restauração é minúsculo e aceito pelo validador do snapshot', () => {
  const database = createValidationDatabaseName(new Date('2026-10-29T12:34:56.789Z'), 'a1b2c3');

  assert.equal(database, 'minimercado_restore_20261029t123456z_a1b2c3');
  assert.equal(database, database.toLowerCase());
  assert.equal(isSafeDatabaseName(database), true);
});
