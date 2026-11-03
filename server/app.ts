import Fastify from 'fastify';
import {ZodError} from 'zod';
import {z} from 'zod';
import {assertDatabaseReady,type Database} from './database';
import {createAuth} from './auth';
import {snapshot,adjustStock,addStore,addProduct,updateProduct,canAccess,lookupCode,readPhoto,HttpError,type Member} from './inventory';
import {listOperators,createOperator,updateOperatorStores,deactivateOperator,completeFirstAccess} from './users';
import {exportInventoryCsv} from '../src/domain/catalog';
import {authRequestHeaders,type ProxyMode} from './proxy';
export function createApp(db:Database,secret:string,origin='http://127.0.0.1:5174',proxyMode:ProxyMode='socket'){
 const auth=createAuth(db,secret,origin);const app=Fastify({bodyLimit:16384,logger:false,trustProxy:false});
 app.setErrorHandler((err,request,reply)=>{if(err instanceof ZodError)return reply.code(400).send({error:'Confira os campos informados.',fields:err.flatten().fieldErrors});const e=err as Error&{statusCode?:number;code?:string};if(e.code==='23505')return reply.code(409).send({error:'Registro já cadastrado.'});const status=e.statusCode??500;return reply.code(status).send({error:status<500?e.message:'Não foi possível concluir a operação.',...(e.code?{code:e.code}:{})});});
 app.addHook('onRequest',async(req,reply)=>{
  reply.header('Cache-Control','no-store');reply.header('X-Content-Type-Options','nosniff');
  if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.origin!==origin)throw new HttpError(403,'Origem da solicitação não permitida.');
 });
 app.route({method:['GET','POST'],url:'/api/auth/*',handler:async(req,reply)=>{
  // No public registration, password reset or profile endpoints in this local milestone.
  const route=req.url.split('?')[0];if(!['/api/auth/sign-in/email','/api/auth/sign-out','/api/auth/get-session','/api/auth/ok'].includes(route))throw new HttpError(404,'Rota não disponível.');
  const response=await auth.handler(new Request(new URL(req.url,origin),{method:req.method,headers:authRequestHeaders(req,proxyMode),...(req.body?{body:JSON.stringify(req.body)}:{})}));
  reply.code(response.status);response.headers.forEach((v,k)=>{if(k!=='set-cookie')reply.header(k,v);});const cookies=response.headers.getSetCookie();if(cookies.length)reply.header('set-cookie',cookies);return reply.send(await response.text());
 }});
 app.get('/api/health',async(_req,reply)=>{try{await assertDatabaseReady(db);return {status:'ok'};}catch{return reply.code(503).send({status:'unavailable'});}});
 app.register(async secured=>{
  secured.decorateRequest('member',null);secured.decorateRequest('identity',null);
  secured.addHook('preHandler',async req=>{const session=await auth.api.getSession({headers:authRequestHeaders(req,proxyMode)});if(!session)throw new HttpError(401,'Entre para continuar.');const member=(await db.query<Member>('SELECT user_id,network_id,role,active,password_setup_required FROM memberships WHERE user_id=$1',[session.user.id])).rows[0];if(!member||!member.active)throw new HttpError(403,'Usuário sem acesso ativo a uma rede.');if(member.password_setup_required&&req.url!=='/api/account/change-password')throw new HttpError(428,'Defina uma nova senha antes de continuar.','PASSWORD_CHANGE_REQUIRED');(req as any).member=member;(req as any).identity={name:session.user.name,email:session.user.email};});
  secured.get('/api/workspace',async req=>({...await snapshot(db,(req as any).member),user:(req as any).identity}));
  secured.get('/api/users',async req=>listOperators(db,(req as any).member));
  secured.post('/api/users',async(req,reply)=>reply.code(201).send(await createOperator(db,auth,(req as any).member,req.body)));
  secured.post('/api/users/access',async req=>updateOperatorStores(db,(req as any).member,req.body));
  secured.post('/api/users/deactivate',async req=>deactivateOperator(db,auth,(req as any).member,req.body,authRequestHeaders(req,proxyMode)));
  secured.post('/api/account/change-password',async req=>completeFirstAccess(db,auth,(req as any).member,req.body,authRequestHeaders(req,proxyMode)));
  secured.get('/api/export.csv',async(req,reply)=>{const query=z.object({storeId:z.string().min(1)}).parse(req.query);const member=(req as any).member as Member;await canAccess(db,member,query.storeId);const workspace=await snapshot(db,member);const store=workspace.stores.find((s:any)=>s.id===query.storeId);if(!store)throw new HttpError(404,'Loja não encontrada.');const file=exportInventoryCsv(workspace.products.filter((p:any)=>p.storeId===query.storeId) as any,store.name);return reply.header('Content-Type','text/csv; charset=utf-8').header('Content-Disposition',`attachment; filename="${file.filename}"`).send(file.content);});
  secured.post('/api/stores',async(req,reply)=>reply.code(201).send(await addStore(db,(req as any).member,req.body)));
  secured.post('/api/products',async(req,reply)=>reply.code(201).send(await addProduct(db,(req as any).member,req.body)));
  secured.post('/api/products/from-scan',{bodyLimit:4*1024*1024+16384},async(req,reply)=>reply.code(201).send(await addProduct(db,(req as any).member,req.body,true)));
  secured.get('/api/products/lookup',async req=>lookupCode(db,(req as any).member,req.query));
  secured.get('/api/products/:productId/photo',async(req,reply)=>{
   const {productId}=z.object({productId:z.coerce.number().int().positive()}).parse(req.params);
   const {storeId}=z.object({storeId:z.string().min(1)}).parse(req.query);
   const photo=await readPhoto(db,(req as any).member,productId,storeId);
   return reply.header('Content-Type',photo.mime).header('Cache-Control','private, no-store').header('Cross-Origin-Resource-Policy','same-origin').send(photo.content);
  });
  secured.post('/api/products/update',async req=>updateProduct(db,(req as any).member,req.body));
  secured.post('/api/adjustments',async req=>adjustStock(db,(req as any).member,req.body));
 });
 return {app,auth};
}
