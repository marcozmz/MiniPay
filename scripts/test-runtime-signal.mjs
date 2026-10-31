// Imported only by the verification harness, never by npm start normally.
// Windows cannot deliver POSIX signals. Exercise the installed SIGTERM handler
// cooperatively in the actual npm-start child, without taskkill or app endpoints.
if(process.argv[1]?.replaceAll('\\','/').endsWith('/dist-server/server/index.js')){
 process.stdin.once('data',()=>{
  process.stdin.destroy();
  process.emit('SIGTERM','SIGTERM');
 });
}
