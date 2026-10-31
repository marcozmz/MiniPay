import { randomBytes } from 'node:crypto';

export function isSafeDatabaseName(database) {
  return typeof database === 'string' && /^[a-z][a-z0-9_]{0,62}$/.test(database);
}

export function createValidationDatabaseName(date = new Date(), suffix = randomBytes(3).toString('hex')) {
  const timestamp = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const database = `minimercado_restore_${timestamp}_${suffix}`.toLowerCase();
  if (!isSafeDatabaseName(database)) throw new Error('Identificador de banco de validação inválido.');
  return database;
}
