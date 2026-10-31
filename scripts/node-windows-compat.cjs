// tsx reads os.userInfo() to name its temporary directory. Some managed Windows
// sessions fail this lookup with ENOMEM, even though USERNAME and homedir work.
// Keep the native behavior everywhere else; preload also reaches test workers.
const os = require('node:os');
const { syncBuiltinESMExports } = require('node:module');
const nativeUserInfo = os.userInfo;
if (process.platform === 'win32') {
  os.userInfo = function (options) {
    try {
      return nativeUserInfo.call(os, options);
    } catch (error) {
      if (error.code !== 'ERR_SYSTEM_ERROR' || error.info?.code !== 'ENOMEM' ||
          error.info?.syscall !== 'uv_os_get_passwd' || !process.env.USERNAME) throw error;
      const encode = value => options?.encoding === 'buffer' ? Buffer.from(value) : value;
      return { username: encode(process.env.USERNAME), homedir: encode(os.homedir()), uid: -1, gid: -1, shell: null };
    }
  };
  syncBuiltinESMExports();
}
