import {readFile,readdir} from 'node:fs/promises';
import {join,extname} from 'node:path';
import type {FastifyInstance} from 'fastify';

const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
// Inventory only the public build; never resolve request paths against the disk.
export async function serveFrontend(app:FastifyInstance,root:string){
 const files=new Map<string,string>();
 async function walk(dir:string,prefix=''){for(const entry of await readdir(dir,{withFileTypes:true})){
  if(entry.name.startsWith('.')||entry.isSymbolicLink())continue;
  const path=join(dir,entry.name),url=`${prefix}/${entry.name}`;
  if(entry.isDirectory())await walk(path,url);
  else if(entry.isFile()&&mime[extname(entry.name)])files.set(url,path);
 }}
 await walk(root);const index=files.get('/index.html');if(!index)throw new Error('Frontend compilado ausente. Execute npm run build.');
 await readFile(index);
 app.setNotFoundHandler(async(req,reply)=>{
  const missing=()=>reply.code(404).type('application/json').send({error:'Rota não encontrada.'});
  let pathname:string;try{pathname=decodeURIComponent(req.url.split('?')[0]);}catch{return missing();}
  if(!['GET','HEAD'].includes(req.method)||pathname==='/api'||pathname.startsWith('/api/')||pathname.includes('\\')||pathname.split('/').some(p=>p.startsWith('.')))return missing();
  let file=files.get(pathname);
  if(!file&&req.method==='GET'&&req.headers.accept?.split(',').some(v=>/^text\/html(?:\s*;|$)/.test(v.trim())&&!/;\s*q=0(?:\.0*)?(?:;|$)/.test(v))&&!extname(pathname)&&!pathname.startsWith('/assets/')&&!pathname.startsWith('/icons/'))file=index;
  if(!file)return missing();
  reply.header('Cache-Control','no-store').type(mime[extname(file)]);
  if(pathname==='/sw.js')reply.header('Service-Worker-Allowed','/');
  const contents=await readFile(file);
  if(req.method==='HEAD')return reply.header('Content-Length',contents.length).send();
  return reply.send(contents);
 });
}
