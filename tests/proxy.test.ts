import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../server/database';
import {createApp} from '../server/app';
import {loadConfig} from '../server/config';

test('modo de proxy é explícito, local usa socket e valores permissivos são recusados',()=>{
 assert.equal(loadConfig({}).proxyMode,'socket');
 assert.equal(loadConfig({TRUSTED_PROXY_MODE:'railway-edge'}).proxyMode,'railway-edge');
 for(const mode of ['true','*','1','0.0.0.0/0',''])assert.throws(()=>loadConfig({TRUSTED_PROXY_MODE:mode}),/TRUSTED_PROXY_MODE/);
});

test('login: limite real do Better Auth, origem confiável, clientes separados e falsificação',async t=>{
 const schema='test_'+randomUUID().replaceAll('-','');const db=await openDatabase(schema);
 const origin='https://proxy.example.test',secret='test-only-proxy-validation-secret-1234567890';
 const direct=createApp(db,secret,origin,'socket');const edge=createApp(db,secret,origin,'railway-edge');
 const credentials={email:'proxy-admin@example.test',password:'proxy-test-password-12345'};
 try{
  const user=await direct.auth.api.signUpEmail({body:{...credentials,name:'Admin Proxy Teste'}});
  const inject=(app:typeof direct.app,options:any):Promise<any>=>Promise.resolve((app.inject as any)(options));
  const login=(app:typeof direct.app,address:string,headers:Record<string,any>={},password='wrong-password-12345')=>inject(app,{method:'POST',url:'/api/auth/sign-in/email',remoteAddress:address,headers:{origin,...headers},payload:{...credentials,password}});
  const forged=(index:number)=>({'x-forwarded-for':`203.0.113.${index}, 192.0.2.99`,'x-real-ip':`198.51.100.${index}`,'forwarded':`for=203.0.113.${index}`,'x-minimercado-client-ip':`192.0.2.${index}`});
  await t.test('socket ignora todos os cabeçalhos de IP do cliente; sexta tentativa dá 429',async()=>{
   for(let i=1;i<=5;i++)assert.equal((await login(direct.app,'192.0.2.10',forged(i))).statusCode,401);
   const blocked=await login(direct.app,'192.0.2.10',forged(6),credentials.password);assert.equal(blocked.statusCode,429);assert(Number(blocked.headers['x-retry-after'])>0);
   assert.equal((await login(direct.app,'192.0.2.11',forged(7),credentials.password)).statusCode,200);
   const ips=(await db.query('SELECT "ipAddress" FROM session WHERE "userId"=$1',[user.user.id])).rows.map(row=>row.ipAddress);
   assert(ips.includes('192.0.2.11'));assert(!ips.includes('198.51.100.7'));
  });
  // Controlled edge fixture overwrites X-Real-IP as required by the Railway
  // ingress contract. Real Railway overwrite/isolation must be checked on deploy.
  const atEdge=(address:string,headers:Record<string,any>={},password?:string)=>login(edge.app,'100.64.0.20',{...headers,'x-real-ip':address},password);
  await t.test('edge sobrescreve IP forjado; XFF/Forwarded/cabeçalho interno não mudam o bucket',async()=>{
   for(let i=1;i<=5;i++)assert.equal((await atEdge('203.0.113.10',forged(i))).statusCode,401);
   assert.equal((await atEdge('203.0.113.10',forged(6),credentials.password)).statusCode,429);
   assert.equal((await atEdge('203.0.113.11',forged(7),credentials.password)).statusCode,200);
   const ips=(await db.query('SELECT "ipAddress" FROM session WHERE "userId"=$1',[user.user.id])).rows.map(row=>row.ipAddress);
   assert(ips.includes('203.0.113.11'));assert(!ips.includes('198.51.100.7'));
  });
  await t.test('modo edge recusa IP ausente, malformado ou múltiplo sem cair no bucket local',async()=>{
   for(const value of [undefined,'','not-an-ip','203.0.113.1, 203.0.113.2',['203.0.113.1','203.0.113.2']]){
    const headers={origin,...(value===undefined?{}:{'x-real-ip':value})};
    assert.equal((await inject(edge.app,{method:'POST',url:'/api/auth/sign-in/email',headers,payload:credentials})).statusCode,400);
   }
   assert.equal((await inject(edge.app,{url:'/api/health'})).statusCode,200);
  });
  await t.test('tentativas simultâneas consomem limite atomicamente',async()=>{
   const results=await Promise.all(Array.from({length:8},(_,i)=>atEdge('203.0.113.20',forged(i+1))));
   assert.equal(results.filter(r=>r.statusCode===401).length,5);assert.equal(results.filter(r=>r.statusCode===429).length,3);
  });
  await t.test('IPv4 mapeado e variações dentro de IPv6 /64 não permitem trocar de bucket',async()=>{
   for(let i=1;i<=5;i++)assert.equal((await atEdge('203.0.113.30')).statusCode,401);
   assert.equal((await atEdge('::ffff:203.0.113.30')).statusCode,429);
   for(let i=1;i<=5;i++)assert.equal((await atEdge('2001:db8:abcd:1234::1')).statusCode,401);
   assert.equal((await atEdge('2001:0db8:abcd:1234:0000:0000:0000:ffff')).statusCode,429);
   assert.equal((await atEdge('2001:db8:abcd:1235::1',{},credentials.password)).statusCode,200);
  });
 }finally{await direct.app.close();await edge.app.close();await db.dropTestSchema();await db.close();}
});
