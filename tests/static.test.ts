import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {resolve} from 'node:path';
import {serveFrontend} from '../server/static';

test('Fastify serve o build e recarga SPA; API, mutações e arquivos ausentes conservam 404',async()=>{
 const app=Fastify();await serveFrontend(app,resolve('dist'));
 try{
  const inject=(options:any):Promise<any>=>Promise.resolve((app.inject as any)(options));
  const root=await inject({url:'/',headers:{accept:'text/html'}});assert.equal(root.statusCode,200);
  const scripts=[...root.body.matchAll(/(?:src|href)="([^\"]+\.(?:js|css))"/g)].map(match=>match[1]);assert.equal(scripts.length,2);
  for(const url of ['/estoque','/painel/lojas']){const r=await inject({url,headers:{accept:'text/html'}});assert.equal(r.statusCode,200);assert.equal(r.body,root.body);assert.match(r.headers['content-type'],/text\/html; charset=utf-8/);}
  for(const url of ['/api','/api/unknown','/missing.js','/assets/missing','/icons/missing','/.local/auth-secret','/server/index.ts','/%2e%2e/.local/auth-secret']){const r=await inject({url,headers:{accept:'text/html'}});assert.equal(r.statusCode,404,url);assert.doesNotMatch(r.headers['content-type'],/text\/html/);}
  for(const accept of ['application/json','text/html;q=0','*/*'])assert.equal((await inject({url:'/not-html',headers:{accept}})).statusCode,404);
  for(const method of ['POST','PUT','DELETE','HEAD'])assert.equal((await inject({method,url:'/estoque',headers:{accept:'text/html'}})).statusCode,404);
  for(const [url,type] of [...scripts.map(url=>[url,url.endsWith('.js')?'javascript':'text/css']),['/sw.js','javascript'],['/manifest.webmanifest','manifest'],['/offline.html','html'],['/icons/icon-192.png','image/png']]){const r=await inject({url});assert.equal(r.statusCode,200);assert(r.headers['content-type'].includes(type));assert.equal(r.headers['cache-control'],'no-store');}
  assert.equal((await inject({url:'/sw.js',method:'HEAD'})).body,'');
 }finally{await app.close();}
});
