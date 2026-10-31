import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {loadConfig} from '../server/config';
import {openDatabase} from '../server/database';
import {bootstrapAdmin} from '../server/bootstrap';
import {createApp} from '../server/app';
import {serveFrontend} from '../server/static';
import {resolve} from 'node:path';

test('produção exige configuração explícita e rejeita origem, porta e segredo inválidos sem revelar valores',()=>{
 const valid={NODE_ENV:'production',PUBLIC_ORIGIN:'https://online.example.test',BETTER_AUTH_SECRET:'test-only-configuration-secret-with-entropy-0123456789',DATABASE_URL:'postgresql://test:test@127.0.0.1/test'};
 assert.equal(loadConfig(valid).host,'::');assert.equal(loadConfig({}).host,'127.0.0.1');
 for(const key of ['PUBLIC_ORIGIN','BETTER_AUTH_SECRET','DATABASE_URL']){const env={...valid};delete env[key as keyof typeof env];assert.throws(()=>loadConfig(env),new RegExp(key));}
 for(const PUBLIC_ORIGIN of ['http://example.test','https://example.test/','https://example.test/path','https://user:password@example.test','https://example.test?x=1'])assert.throws(()=>loadConfig({...valid,PUBLIC_ORIGIN}),/PUBLIC_ORIGIN/);
 for(const PORT of ['0','65536','12a','1.5',''])assert.throws(()=>loadConfig({...valid,PORT}),/PORT/);
 for(const BETTER_AUTH_SECRET of ['short','x'.repeat(48)])assert.throws(()=>loadConfig({...valid,BETTER_AUTH_SECRET}),/BETTER_AUTH_SECRET/);
 assert.throws(()=>loadConfig({...valid,HOST:'https://example.test'}),/HOST/);
 assert.throws(()=>loadConfig({...valid,DATABASE_URL:'sensitive-invalid-value'}),error=>error instanceof Error&&!error.message.includes('sensitive-invalid-value'));
});

test('artefato frontend, migração explícita, bootstrap único e cookies HTTPS por injeção',async()=>{
 const schema='test_'+randomUUID().replaceAll('-','');
 await assert.rejects(openDatabase(schema,{migrate:false}));
 const db=await openDatabase(schema);const origin='https://online.example.test';
 const {app}=createApp(db,'test-only-secret-for-online-validation-123456789',origin);
 try{
  assert.equal((await db.query('SELECT 1 FROM "user"')).rows.length,0);
  const values={email:'bootstrap@example.test',name:'Admin Teste',password:'initial-test-password-12345',networkName:'Rede Teste',franchiseeName:'Franqueado Teste'};
  await bootstrapAdmin(db,values);await assert.rejects(bootstrapAdmin(db,values));
  assert.equal((await db.query('SELECT 1 FROM "user"')).rows.length,1);
  assert.equal((await db.query('SELECT 1 FROM stores')).rows.length,0);
  assert.equal((await db.query('SELECT 1 FROM products')).rows.length,0);
  await serveFrontend(app,resolve('dist'));
  const inject=(options:any):Promise<any>=>Promise.resolve((app.inject as any)(options));
  for(const url of ['/','/estoque','/painel/lojas']){const r=await inject({url,headers:{accept:'text/html'}});assert.equal(r.statusCode,200);assert.match(r.headers['content-type'],/text\/html; charset=utf-8/);}
  for(const url of ['/api','/api/unknown','/missing.js','/assets/missing','/icons/missing','/.local/auth-secret','/server/index.ts','/%2e%2e/.local/auth-secret']){const r=await inject({url,headers:{accept:'text/html'}});assert.equal(r.statusCode,404,url);assert.doesNotMatch(r.headers['content-type'],/text\/html/);}
  assert.equal((await inject({url:'/not-html',headers:{accept:'application/json'}})).statusCode,404);
  assert.equal((await inject({url:'/not-html',headers:{accept:'text/html;q=0'}})).statusCode,404);
  assert.equal((await inject({method:'POST',url:'/estoque',headers:{origin,accept:'text/html'}})).statusCode,404);
  for(const [url,type] of [['/sw.js','javascript'],['/manifest.webmanifest','manifest'],['/offline.html','html'],['/icons/icon-192.png','image/png']]){const r=await inject({url});assert.equal(r.statusCode,200);assert(r.headers['content-type'].includes(type));assert.equal(r.headers['cache-control'],'no-store');}
  const login=await inject({method:'POST',url:'/api/auth/sign-in/email',headers:{origin},payload:{email:values.email,password:values.password}});assert.equal(login.statusCode,200);
  const cookies=login.headers['set-cookie'];assert.match(String(cookies),/Secure/);assert.match(String(cookies),/HttpOnly/);assert.match(String(cookies),/SameSite=Lax/i);
  const cookie=login.cookies.map((c:any)=>`${c.name}=${c.value}`).join('; ');
  assert.equal((await inject({url:'/api/workspace',headers:{cookie}})).statusCode,428);
  assert.equal((await inject({method:'POST',url:'/api/account/change-password',headers:{origin,cookie},payload:{currentPassword:values.password,newPassword:'changed-test-password-67890'}})).statusCode,200);
  assert.equal((await inject({url:'/api/workspace',headers:{cookie}})).statusCode,200);
  assert.equal((await inject({method:'POST',url:'/api/auth/sign-out',headers:{origin:'https://evil.example',cookie},payload:{}})).statusCode,403);
  assert.equal((await inject({method:'POST',url:'/api/auth/sign-out',headers:{origin,cookie},payload:{}})).statusCode,200);
  assert.equal((await inject({url:'/api/workspace',headers:{cookie}})).statusCode,401);
  assert.equal((await inject({url:'/api/health'})).statusCode,200);
  await db.query('DELETE FROM schema_migrations WHERE version=6');
  assert.equal((await inject({url:'/api/health'})).statusCode,503);
  await assert.rejects(openDatabase(schema,{migrate:false}));
 }finally{await app.close();await db.dropTestSchema();await db.close();}
});
