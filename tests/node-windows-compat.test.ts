import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../scripts/node-windows-compat.cjs', import.meta.url), 'utf8');
function setup(platform: string, userInfo: () => unknown, username?: string) {
  const os = { userInfo, homedir: () => 'C:/Users/test' };
  runInNewContext(source, {
    require: (name: string) => name === 'node:os' ? os : { syncBuiltinESMExports() {} },
    process: { platform, env: { USERNAME: username } }, Buffer,
  });
  return os;
}
test('compatibilidade preserva userInfo nativo e não altera outros sistemas', () => {
  const native = () => ({ username: 'native' });
  assert.deepEqual(setup('win32', native, 'test').userInfo(), native());
  assert.equal(setup('linux', native, 'test').userInfo, native);
});
test('compatibilidade cobre somente ENOMEM de uv_os_get_passwd no Windows com USERNAME', () => {
  const error = Object.assign(new Error('lookup failed'), { code: 'ERR_SYSTEM_ERROR', info: { code: 'ENOMEM', syscall: 'uv_os_get_passwd' } });
  const failing = () => { throw error; };
  const fallback = setup('win32', failing, 'test').userInfo() as any;
  assert.equal(fallback.username, 'test');assert.equal(fallback.homedir, 'C:/Users/test');
  assert.equal(fallback.uid, -1);assert.equal(fallback.gid, -1);
  assert.throws(() => setup('win32', failing).userInfo(), e => e === error);
  const otherError = new Error('different failure');
  assert.throws(() => setup('win32', () => { throw otherError; }, 'test').userInfo(), e => e === otherError);
});
