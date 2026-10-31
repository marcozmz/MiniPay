// Local verification only. Creates and PRESERVES a separate database; never seeds
// or migrates the source database. Secrets are read internally, never printed.
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import assert from 'node:assert/strict';
import {Pool} from 'pg';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const npmCli=process.env.npm_execpath;
if(!npmCli)throw Error('Execute via npm run verify:online.');
const source=new URL(process.env.DATABASE_URL??(await readFile('.local/database-url','utf8')).trim());
if(!['localhost','127.0.0.1','[::1]'].includes(source.hostname))throw Error('Verificação permitida somente em PostgreSQL local.');
const database=`minimercado_online_${new Date().toISOString().replace(/\D/g,'').slice(0,14)}_${randomBytes(3).toString('hex')}`;
const admin=new Pool({connectionString:source.toString(),connectionTimeoutMillis:10000});
try{await admin.query(`CREATE DATABASE "${database}"`);}finally{await admin.end();}
console.log(`Banco separado criado e preservado: ${database}`);
source.pathname=`/${database}`;
const listener=createServer();listener.listen(0,'127.0.0.1');await once(listener,'listening');const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
const address=`http://127.0.0.1:${port}`,origin='https://online.example.test';
const env={...process.env,DATABASE_URL:source.toString(),DATABASE_TLS_MODE:'disable-local',TRUSTED_PROXY_MODE:'socket',NODE_ENV:'production',HOST:'127.0.0.1',PORT:String(port),PUBLIC_ORIGIN:origin,BETTER_AUTH_SECRET:randomBytes(48).toString('base64url'),BOOTSTRAP_ADMIN_EMAIL:'online-admin@example.test',BOOTSTRAP_ADMIN_NAME:'Admin Teste Online',BOOTSTRAP_ADMIN_PASSWORD:randomBytes(24).toString('base64url'),BOOTSTRAP_NETWORK_NAME:'Rede Teste Online',BOOTSTRAP_FRANCHISEE_NAME:'Franqueado Teste Online'};
async function npm(args,extra={},expected=0){
 const child=spawn(process.execPath,[npmCli,...args],{env:{...env,...extra},windowsHide:true,stdio:['ignore','pipe','pipe'],timeout:120000});let output='';
 child.stdout.on('data',data=>output+=data);child.stderr.on('data',data=>output+=data);
 const [code]=await once(child,'exit');assert.equal(code,expected,`${args.join(' ')} falhou (saída omitida para proteger configuração).`);
 if(args[0]==='test'){const summary=output.split(/\r?\n/).filter(line=>/^# (tests|pass|fail|skipped|duration_ms) /.test(line));console.log(summary.join('\n'));}
 else console.log(`${args.join(' ')}: resultado esperado (${code}).`);
 return output;
}
const skipTests=process.argv.includes('--skip-tests');
if(!skipTests){await npm(['start'],{BETTER_AUTH_SECRET:''},1);await npm(['start'],{},1);}
await npm(['run','db:migrate']);if(!skipTests)await npm(['run','db:migrate']);
await npm(['run','db:bootstrap-admin']);
if(!skipTests){await npm(['run','db:bootstrap-admin'],{},1);await npm(['test'],{NODE_ENV:'test'});}
let server;
async function start(extra={}){
 const nodeOptions=`--import=${pathToFileURL(resolve('scripts/test-runtime-signal.mjs')).href}`;
 server=spawn(process.execPath,[npmCli,'start'],{env:{...env,...extra,NODE_OPTIONS:nodeOptions},windowsHide:true,stdio:['pipe','pipe','pipe']});
 let ready=false,diagnostic='';server.stdout.on('data',data=>{if(data.toString().includes('Servidor pronto.'))ready=true;});server.stderr.on('data',data=>{diagnostic+=data;});
 for(let attempt=0;attempt<100&&!ready;attempt++){if(server.exitCode!==null){const safe=diagnostic.split(/\r?\n/).find(line=>line.startsWith('Inicialização falhou em '));throw Error(`Servidor compilado não iniciou. ${safe??'Saída omitida.'}`);}await new Promise(resolve=>setTimeout(resolve,100));}
 assert(ready,'Servidor não ficou pronto.');
}
async function stop(){
 if(!server)return;
 if(server.exitCode!==null){server=undefined;return;}
 const exited=once(server,'exit');
 server.stdin.write('shutdown\n');
 const deadline=setTimeout(()=>{console.error('Encerramento cooperativo de teste excedeu o prazo.');},12000);deadline.unref();
 try{const [code]=await exited;assert.equal(code,0,'Servidor não encerrou corretamente.');}finally{clearTimeout(deadline);}
 server=undefined;
}
try{
 await start();
 const request=(path,options={})=>fetch(address+path,options);
 const index=await request('/',{headers:{accept:'text/html'}});assert.equal(index.status,200);const html=await index.text();
 const script=html.match(/src="([^\"]+\.js)"/)[1];const css=html.match(/href="([^\"]+\.css)"/)[1];
 for(const path of [script,css,'/manifest.webmanifest','/sw.js','/offline.html'])assert.equal((await request(path)).status,200,path);
 assert.equal(await (await request('/painel/estoque',{headers:{accept:'text/html'}})).text(),html);
 for(const path of ['/api','/api/no-route','/assets/missing.js','/missing.css','/.local/database-url']){const r=await request(path,{headers:{accept:'text/html'}});assert.equal(r.status,404);assert(!r.headers.get('content-type').includes('text/html'));}
 assert.equal((await request('/api/health')).status,200);assert.equal((await request('/api/workspace')).status,401);
 const post=(path,body,cookie='',requestOrigin=origin)=>request(path,{method:'POST',headers:{origin:requestOrigin,'content-type':'application/json',cookie},body:JSON.stringify(body)});
 assert.equal((await post('/api/auth/sign-in/email',{email:env.BOOTSTRAP_ADMIN_EMAIL,password:'wrong-password-12345'})).status,401);
 let login=await post('/api/auth/sign-in/email',{email:env.BOOTSTRAP_ADMIN_EMAIL,password:env.BOOTSTRAP_ADMIN_PASSWORD});assert.equal(login.status,200);
 assert(login.headers.getSetCookie().every(value=>/Secure/i.test(value)&&/HttpOnly/i.test(value)&&/SameSite=Lax/i.test(value)));
 let cookie=login.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
 assert.equal((await request('/api/workspace',{headers:{cookie}})).status,428);
 const newPassword=randomBytes(24).toString('base64url');
 assert.equal((await post('/api/account/change-password',{currentPassword:env.BOOTSTRAP_ADMIN_PASSWORD,newPassword},cookie)).status,200);
 let workspace=await request('/api/workspace',{headers:{cookie}});assert.equal(workspace.status,200);let state=await workspace.json();assert.equal(state.products.length,0);assert.equal(state.stores.length,0);
 assert.equal((await post('/api/auth/sign-out',{},cookie,'https://evil.example')).status,403);
 // Same secret/database after restart must preserve the session.
 await stop();await start();assert.equal((await request('/api/workspace',{headers:{cookie}})).status,200);
 assert.equal((await post('/api/auth/sign-out',{},cookie)).status,200);assert.equal((await request('/api/workspace',{headers:{cookie}})).status,401);
 console.log('npm start compilado: assets, recarga SPA, API/404, login, troca obrigatória, sessão após reinício, CSRF e logout aprovados.');
 console.log('Secure/HttpOnly/SameSite conferidos em headers; transporte local HTTP com Origin HTTPS simulado, sem validação TLS/navegador.');
 await stop();
 if(process.argv.includes('--serve')){
  await start({NODE_ENV:'development',PUBLIC_ORIGIN:address});
  console.log(`Verificação visual disponível: ${address}`);
  // Test fixture only: restore the initial random password via the normal login change
  // is unnecessary; browser can verify the anonymous screen without credentials.
  await new Promise(resolve=>{process.once('SIGINT',resolve);process.once('SIGTERM',resolve);});
 }
}finally{await stop();}
