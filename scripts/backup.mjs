import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, readdir, rename, stat } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidationDatabaseName, isSafeDatabaseName } from './backup-names.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backupDir = path.join(root, '.local', 'backups');
const envFile = path.join(root, '.local', 'postgres.env');
const databaseUrlFile = path.join(root, '.local', 'database-url');
const databaseName = 'minimercado';
const composeArgs = ['compose', '--env-file', '.local/postgres.env'];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

async function assertLocalDatabase() {
  let connection;
  try { connection = new URL((await readFile(databaseUrlFile, 'utf8')).trim()); }
  catch { throw new Error('Banco local não configurado. Execute npm run db:up.'); }
  if (!['127.0.0.1', 'localhost', '::1', '[::1]'].includes(connection.hostname) || connection.port !== '5433' || connection.pathname !== `/${databaseName}`) {
    throw new Error('Operação permitida somente no PostgreSQL local minimercado da porta 5433.');
  }
  try { await stat(envFile); }
  catch { throw new Error('Configuração local do Compose ausente. Execute npm run db:up.'); }
}

function dockerArgs(commandArgs) {
  return [...composeArgs, 'exec', '-T', 'db', ...commandArgs];
}

function waitForChild(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
}

async function streamDockerOutput(commandArgs, outputPath) {
  const child = spawn('docker', dockerArgs(commandArgs), { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
  try {
    const result = await Promise.all([waitForChild(child), pipeline(child.stdout, createWriteStream(outputPath, { flags: 'wx', mode: 0o600 }))]);
    if (result[0].code !== 0) throw new Error('pg_dump falhou.');
  } catch {
    throw new Error('Não foi possível gerar um backup completo pelo pg_dump. O arquivo parcial, se criado, não é listado como backup válido.');
  }
}

async function pipeArchiveToDocker(commandArgs, archivePath) {
  const child = spawn('docker', dockerArgs(commandArgs), { cwd: root, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
  const chunks = [];
  child.stdout.on('data', chunk => chunks.push(chunk));
  try {
    const result = await Promise.all([waitForChild(child), pipeline(createReadStream(archivePath), child.stdin)]);
    if (result[0].code !== 0) throw new Error('Comando PostgreSQL falhou.');
    return Buffer.concat(chunks).toString('utf8');
  } catch {
    throw new Error('O PostgreSQL não conseguiu validar/restaurar o arquivo. Nenhuma restauração foi declarada concluída.');
  }
}

async function validateArchive(archivePath) {
  const listing = await pipeArchiveToDocker(['sh', '-c', 'PGPASSWORD="$POSTGRES_PASSWORD" exec pg_restore --list'], archivePath);
  if (!/^;\s+dbname: minimercado\s*$/m.test(listing) || !/^;\s+Format: CUSTOM\s*$/m.test(listing)) {
    throw new Error('O arquivo não identifica o banco local minimercado em formato customizado do PostgreSQL.');
  }
}

async function captureDocker(commandArgs) {
  const child = spawn('docker', dockerArgs(commandArgs), { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
  const chunks = [];
  child.stdout.on('data', chunk => chunks.push(chunk));
  const { code } = await waitForChild(child);
  if (code !== 0) throw new Error('Não foi possível consultar o PostgreSQL local.');
  return Buffer.concat(chunks).toString('utf8').trim();
}

const statsSql = `SET search_path TO minimercado; SELECT json_build_object(
 'users',(SELECT count(*) FROM "user"),
 'admins',(SELECT count(*) FROM memberships WHERE role='admin' AND active),
 'operators',(SELECT count(*) FROM memberships WHERE role='operator'),
 'operatorsActive',(SELECT count(*) FROM memberships WHERE role='operator' AND active),
 'operatorsInactive',(SELECT count(*) FROM memberships WHERE role='operator' AND NOT active),
 'storeAccess',(SELECT count(*) FROM store_access),
 'products',(SELECT count(*) FROM products),
 'listings',(SELECT count(*) FROM listings),
 'priceCentsTotal',(SELECT coalesce(sum(price),0) FROM listings),
 'stockUnitsTotal',(SELECT coalesce(sum(stock),0) FROM listings),
 'movements',(SELECT count(*) FROM movements),
 'listingChanges',(SELECT count(*) FROM listing_changes),
 'accessHistory',(SELECT count(*) FROM access_history)
)::text;`;

async function snapshot(database) {
  if (!isSafeDatabaseName(database)) throw new Error('Identificador de banco de validação inválido.');
  const result = await captureDocker([
    'sh', '-c', 'PGPASSWORD="$POSTGRES_PASSWORD" exec psql -X -qAt --username=minimercado --dbname="$1" --command="$2"',
    'sh', database, statsSql,
  ]);
  const lines = result.split(/\r?\n/).filter(Boolean);
  const jsonLine = lines.at(-1);
  if (!jsonLine) throw new Error(`Não foi possível conferir o banco ${database}.`);
  try { return JSON.parse(jsonLine); }
  catch { throw new Error(`Resposta de conferência inválida para ${database}.`); }
}

async function backup() {
  await assertLocalDatabase();
  await mkdir(backupDir, { recursive: true, mode: 0o700 });
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const suffix = randomBytes(3).toString('hex');
  const base = `${databaseName}_${stamp}_${suffix}`;
  const partialPath = path.join(backupDir, `${base}.dump.partial`);
  const completePath = path.join(backupDir, `${base}.dump`);
  try {
    await streamDockerOutput([
      'sh', '-c', 'PGPASSWORD="$POSTGRES_PASSWORD" exec pg_dump --username=minimercado --dbname=minimercado --format=custom --no-owner --no-acl',
    ], partialPath);
    await validateArchive(partialPath);
    await rename(partialPath, completePath);
    const info = await stat(completePath);
    console.log(`Backup concluído: ${path.relative(root, completePath)} (${info.size} bytes; banco ${databaseName}).`);
  } catch (error) {
    fail(error instanceof Error ? error.message : 'Falha no backup.');
  }
}

async function listBackups() {
  await mkdir(backupDir, { recursive: true, mode: 0o700 });
  const entries = await readdir(backupDir, { withFileTypes: true });
  const files = [];
  let partials = 0;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (entry.name.endsWith('.dump.partial')) { partials++; continue; }
    const match = /^(minimercado)_(\d{8}T\d{6}Z)_([a-f0-9]{6})\.dump$/.exec(entry.name);
    if (!match) continue;
    const info = await stat(path.join(backupDir, entry.name));
    const stamp = match[2].replace(/^([0-9]{4})([0-9]{2})([0-9]{2})T([0-9]{2})([0-9]{2})([0-9]{2})Z$/, '$1-$2-$3 $4:$5:$6 UTC');
    files.push({ name: entry.name, stamp, size: info.size });
  }
  files.sort((a, b) => b.name.localeCompare(a.name));
  console.log(`Backups completos em ${path.relative(root, backupDir)} (dados privados; banco ${databaseName}):`);
  if (!files.length) console.log('Nenhum backup completo disponível.');
  for (const file of files) console.log(`${file.stamp}\t${databaseName}\t${file.size} bytes\t${file.name}`);
  if (partials) console.log(`Arquivos parciais ignorados (não são backups válidos): ${partials}`);
}

async function restore(filename) {
  await assertLocalDatabase();
  if (!filename || path.basename(filename) !== filename || !/^(minimercado)_\d{8}T\d{6}Z_[a-f0-9]{6}\.dump$/.test(filename)) {
    throw new Error('Informe o nome de um arquivo .dump completo listado por npm run db:backups.');
  }
  const archivePath = path.join(backupDir, filename);
  const archiveInfo = await stat(archivePath).catch(() => undefined);
  if (!archiveInfo?.isFile() || archiveInfo.size === 0) throw new Error('Backup não encontrado ou vazio.');
  await validateArchive(archivePath);

  const validationDb = createValidationDatabaseName();
  if (!isSafeDatabaseName(validationDb) || validationDb === databaseName) throw new Error('Banco de validação inválido.');
  try {
    await captureDocker([
      'sh', '-c', 'PGPASSWORD="$POSTGRES_PASSWORD" exec createdb --username=minimercado --template=template0 "$1"',
      'sh', validationDb,
    ]);
  } catch {
    throw new Error('Não foi possível criar um banco de validação novo. O banco principal não foi alterado.');
  }

  try {
    await pipeArchiveToDocker([
      'sh', '-c', 'PGPASSWORD="$POSTGRES_PASSWORD" exec pg_restore --username=minimercado --dbname="$1" --exit-on-error --single-transaction --no-owner --no-acl',
      'sh', validationDb,
    ], archivePath);
    const restored = await snapshot(validationDb);
    if (restored.users < 1 || restored.admins < 1 || restored.products < 1 || restored.listings < 1) {
      throw new Error('A cópia não contém o administrador, produtos e saldos esperados.');
    }
    console.log(`Restauração verificada no banco separado ${validationDb}. O banco principal ${databaseName} permaneceu intacto.`);
    console.log(`Conferência: ${JSON.stringify(restored)} (usuários/perfis, permissões de loja, produtos, preços em centavos, saldos, movimentações e históricos).`);
  } catch (error) {
    fail(`Restauração não concluída no banco de validação ${validationDb}: ${error instanceof Error ? error.message : 'falha desconhecida'}. O banco de validação foi preservado para inspeção; nenhum banco foi limpo automaticamente.`);
  }
}

async function main() {
  const [action = 'help', filename] = process.argv.slice(2);
  if (action === 'backup') return backup();
  if (action === 'list') return listBackups();
  if (action === 'restore') return restore(filename);
  throw new Error('Uso: node scripts/backup.mjs backup | list | restore <arquivo.dump>');
}

main().catch(error => fail(error instanceof Error ? error.message : 'Operação de backup/restauração falhou.'));
