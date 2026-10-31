import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../server/database';
import {createApp} from '../server/app';
import {seedWorkspace} from '../server/seed';
const origin='http://127.0.0.1:5174';
const secret='test-only-secret-do-not-use-in-production-123456789';
test('API: autenticação, isolamento, permissões, transações e persistência',async t=>{
 const directory='test_'+randomUUID().replaceAll('-','');
 let db=await openDatabase(directory);let {app,auth}=createApp(db,secret,origin);
 try{
 const admin=await auth.api.signUpEmail({body:{email:'admin@example.test',password:'test-password-12345',name:'Admin'}});await seedWorkspace(db,admin.user.id);
 const operator=await auth.api.signUpEmail({body:{email:'operator@example.test',password:'test-password-12345',name:'Operador'}});
 await db.query("INSERT INTO memberships(user_id,network_id,role) VALUES($1,'demo','operator')",[operator.user.id]);await db.query("INSERT INTO store_access(network_id,user_id,store_id) VALUES('demo',$1,'jardim')",[operator.user.id]);
 const outsider=await auth.api.signUpEmail({body:{email:'other@example.test',password:'test-password-12345',name:'Outra rede'}});
 await db.query("INSERT INTO networks(id,name) VALUES('other','Outra rede')");await db.query("INSERT INTO memberships(user_id,network_id,role) VALUES($1,'other','admin')",[outsider.user.id]);await db.query("UPDATE \"user\" SET role='admin' WHERE id=$1",[outsider.user.id]);
 const inject=(options:any):Promise<any>=>Promise.resolve((app.inject as any)(options));
 const login=async(email:string,password='test-password-12345')=>{const r=await inject({method:'POST',url:'/api/auth/sign-in/email',remoteAddress:email==='admin@example.test'?'127.0.0.2':email==='operator@example.test'?'127.0.0.3':'127.0.0.4',headers:{origin},payload:{email,password}});assert.equal(r.statusCode,200,'Login de teste falhou.');return r.cookies.map((c:any)=>`${c.name}=${c.value}`).join('; ');};
 let cookie=await login('admin@example.test');const opCookie=await login('operator@example.test');const otherCookie=await login('other@example.test');
 const request=(url:string,payload?:unknown,who=cookie)=>inject({method:payload===undefined?'GET':'POST',url,headers:{origin,cookie:who,...(payload===undefined?{}:{'content-type':'application/json'})},...(payload===undefined?{}:{payload:JSON.stringify(payload)})});
 await t.test('nega acesso anônimo, senha errada e cadastro público',async()=>{assert.equal((await inject({url:'/api/workspace'})).statusCode,401);assert.equal((await inject({method:'POST',url:'/api/auth/sign-in/email',headers:{origin},payload:{email:'admin@example.test',password:'incorrect-password'}})).statusCode,401);assert.equal((await request('/api/auth/sign-up/email',{email:'any@example.test',password:'test-password-12345',name:'X'})).statusCode,404);});
 const first=(await request('/api/workspace')).json();const milk=first.products.find((p:any)=>p.code==='7890000000001'&&p.storeId==='jardim');
 await t.test('filtra lojas e produtos pela sessão',async()=>{const op=(await request('/api/workspace',undefined,opCookie)).json();assert.deepEqual(op.stores.map((s:any)=>s.id),['jardim']);assert(op.products.every((p:any)=>p.storeId==='jardim'));const other=(await request('/api/workspace',undefined,otherCookie)).json();assert.equal(other.products.length,0);assert.equal(other.stores.length,0);});
 let managedUser:any;let managedCookie='';let initialPassword='';let managedEmail='';const newPassword='operador-senha-nova-2026';
 await t.test('administrador cria operador com acesso explícito e senha inicial de uso único',async()=>{const body={name:'Operador Gerenciado',email:'managed@example.test',storeIds:['jardim']};assert.equal((await request('/api/users',body,opCookie)).statusCode,403);assert.equal((await request('/api/users',{...body,role:'admin'})).statusCode,400);const result=await request('/api/users',body);assert.equal(result.statusCode,201);const created=result.json();managedUser=created.user;initialPassword=created.initialPassword;managedEmail=body.email;assert.equal(managedUser.active,true);assert.deepEqual(managedUser.storeIds,['jardim']);assert.equal(typeof initialPassword,'string');managedCookie=await login(managedEmail,initialPassword);assert.equal((await request('/api/workspace',undefined,managedCookie)).statusCode,428);assert.equal((await request('/api/users',undefined,managedCookie)).statusCode,428);assert.equal((await request('/api/auth/update-user',{name:'Admin',role:'admin'},managedCookie)).statusCode,404);assert.equal((await request('/api/account/change-password',{currentPassword:initialPassword,newPassword},managedCookie)).statusCode,200);const workspace=(await request('/api/workspace',undefined,managedCookie)).json();assert.deepEqual(workspace.stores.map((s:any)=>s.id),['jardim']);assert(workspace.products.every((p:any)=>p.storeId==='jardim'));assert.equal((await request('/api/users/access',{userId:managedUser.userId,storeIds:['jardim']},managedCookie)).statusCode,403);});
 await t.test('acesso a lojas muda imediatamente, histórico registra ator e CSV também verifica a loja no servidor',async()=>{assert.equal((await request('/api/export.csv?storeId=praca',undefined,managedCookie)).statusCode,404);assert.equal((await request('/api/export.csv?storeId=praca',undefined,otherCookie)).statusCode,404);const response=await request('/api/export.csv?storeId=jardim',undefined,managedCookie);assert.equal(response.statusCode,200);assert.match(response.headers['content-type'],/text\/csv/);assert.equal((await request('/api/users',undefined,opCookie)).statusCode,403);assert.equal((await request('/api/users/access',{userId:managedUser.userId,storeIds:['praca']},otherCookie)).statusCode,404);assert.equal((await request('/api/users/access',{userId:managedUser.userId,storeIds:['praca']})).statusCode,200);const updated=(await request('/api/workspace',undefined,managedCookie)).json();assert.deepEqual(updated.stores.map((s:any)=>s.id),['praca']);assert(updated.products.every((p:any)=>p.storeId==='praca'));assert.equal((await request('/api/export.csv?storeId=jardim',undefined,managedCookie)).statusCode,404);assert.equal((await request('/api/adjustments',{id:randomUUID(),storeId:'jardim',productId:milk.id,expectedVersion:0,operation:'count',quantity:5,reason:'Teste'},managedCookie)).statusCode,404);const audit=(await request('/api/users')).json().history.find((h:any)=>h.action==='stores_changed'&&h.target_email===managedEmail);assert.equal(audit.actor,'Admin');assert.deepEqual(audit.beforeState.storeIds,['jardim']);assert.deepEqual(audit.afterState.storeIds,['praca']);});
 await t.test('desativar revoga sessão e remove as lojas permitidas',async()=>{assert.equal((await request('/api/users/deactivate',{userId:managedUser.userId},managedCookie)).statusCode,403);assert.equal((await request('/api/users/deactivate',{userId:managedUser.userId})).statusCode,200);assert.equal((await request('/api/workspace',undefined,managedCookie)).statusCode,401);const loginResponse=await inject({method:'POST',url:'/api/auth/sign-in/email',headers:{origin},payload:{email:managedEmail,password:newPassword}});assert.equal(loginResponse.statusCode,403);const list=(await request('/api/users')).json();const deactivated=list.users.find((u:any)=>u.userId===managedUser.userId);assert.equal(deactivated.active,false);assert.deepEqual(deactivated.storeIds,[]);const audit=list.history.find((h:any)=>h.action==='operator_deactivated'&&h.target_email===managedEmail);assert.equal(audit.actor,'Admin');assert.deepEqual(audit.afterState.storeIds,[]);});
 const change={id:randomUUID(),storeId:'jardim',productId:milk.id,expectedVersion:0,operation:'count',quantity:25,reason:'Contagem teste'};
 await t.test('bloqueia outra rede, loja sem permissão e origem externa',async()=>{assert.equal((await request('/api/adjustments',change,otherCookie)).statusCode,404);assert.equal((await request('/api/adjustments',{...change,storeId:'praca'},opCookie)).statusCode,404);assert.equal((await inject({method:'POST',url:'/api/adjustments',headers:{cookie,origin:'https://evil.example'},payload:change})).statusCode,403);});
 await t.test('ajuste persistido, auditado e idempotente',async()=>{assert.equal((await request('/api/adjustments',change)).statusCode,200);assert.equal((await request('/api/adjustments',change)).json().replayed,true);assert.equal((await request('/api/adjustments',{...change,quantity:40})).statusCode,409);const next=(await request('/api/workspace')).json();assert.equal(next.history.length,1);assert.equal(next.history[0].actor,'Admin');assert.equal(next.products.find((p:any)=>p.storeId==='jardim'&&p.id===milk.id).stock,25);assert.equal(next.products.find((p:any)=>p.storeId==='praca'&&p.id===milk.id).stock,25);});
 await t.test('conflito e entrada inválida não deixam efeitos parciais',async()=>{assert.equal((await request('/api/adjustments',{...change,id:randomUUID(),quantity:30})).statusCode,409);assert.equal((await request('/api/adjustments',{...change,id:randomUUID(),expectedVersion:1,quantity:-1})).statusCode,400);assert.equal((await request('/api/workspace')).json().history.length,1);});
 await t.test('ajustes concorrentes sem motivo com a mesma versão não sobrescrevem um ao outro',async()=>{const attempts=await Promise.all([26,27].map(stock=>request('/api/adjustments',{...change,id:randomUUID(),expectedVersion:1,quantity:stock,reason:undefined})));assert.deepEqual(attempts.map(r=>r.statusCode).sort(),[200,409]);const state=(await request('/api/workspace')).json();assert.equal(state.history.length,2);assert([26,27].includes(state.products.find((p:any)=>p.id===milk.id&&p.storeId==='jardim').stock));});
 await t.test('cadastros restritos e catálogo compartilhado com preços por loja',async()=>{assert.equal((await request('/api/stores',{name:'Loja Nova'},opCookie)).statusCode,403);assert.equal((await request('/api/stores',{name:'Loja Nova'})).statusCode,201);const product={storeId:'jardim',name:'Biscoito teste',code:'7890000000009',category:'Mercearia',price:990,minimum:2,reason:'Inclusão no catálogo'};assert.equal((await request('/api/products',product,opCookie)).statusCode,403);assert.equal((await request('/api/products',product)).statusCode,201);assert.equal((await request('/api/products',product)).statusCode,409);assert.equal((await request('/api/products',{...product,storeId:'praca',price:1090})).statusCode,201);const snap=(await request('/api/workspace')).json();const products=snap.products.filter((p:any)=>p.code===product.code);assert.equal(products[0].id,products[1].id);assert.deepEqual(products.map((p:any)=>p.price).sort(),[1090,990].sort());});
 let catalogEdit:any;
 await t.test('edita catálogo global e preço/mínimo somente na loja selecionada',async()=>{const snap=(await request('/api/workspace')).json();const jardim=snap.products.find((p:any)=>p.code==='7890000000009'&&p.storeId==='jardim');const praca=snap.products.find((p:any)=>p.code==='7890000000009'&&p.storeId==='praca');catalogEdit={id:randomUUID(),productId:jardim.id,storeId:'jardim',expectedListingVersion:jardim.version,expectedProductVersion:jardim.productVersion,name:'Biscoito atualizado',code:jardim.code,category:'Doces',price:1190,minimum:7,reason:'Revisão de catálogo e preço'};assert.equal((await request('/api/products/update',catalogEdit)).statusCode,200);const updated=(await request('/api/workspace')).json();const a=updated.products.find((p:any)=>p.id===jardim.id&&p.storeId==='jardim');const b=updated.products.find((p:any)=>p.id===praca.id&&p.storeId==='praca');assert.equal(a.price,1190);assert.equal(a.minimum,7);assert.equal(b.price,1090);assert.equal(b.minimum,2);assert.equal(a.name,'Biscoito atualizado');assert.equal(b.name,'Biscoito atualizado');const audit=updated.listingHistory.find((h:any)=>h.storeId==='jardim'&&h.productId===jardim.id&&h.afterValues.price===1190);assert.equal(audit.beforeValues.price,990);assert.equal(audit.afterValues.minimum,7);assert.equal(audit.actor,'Admin');assert.equal((await request('/api/products/update',{...catalogEdit,id:randomUUID(),price:1200},opCookie)).statusCode,403);assert.equal((await request('/api/products/update',{...catalogEdit,id:randomUUID()},otherCookie)).statusCode,404);assert.equal((await request('/api/products/update',{...catalogEdit,id:randomUUID(),expectedListingVersion:0,expectedProductVersion:0})).statusCode,409);assert.equal((await request('/api/products/update',{...catalogEdit,id:randomUUID(),expectedListingVersion:1,expectedProductVersion:1,price:12.5})).statusCode,400);assert.equal((await request('/api/products/update',catalogEdit)).json().replayed,true);});
 await t.test('edições de preço simultâneas rejeitam a versão vencida',async()=>{const snap=(await request('/api/workspace')).json();const p=snap.products.find((p:any)=>p.code==='7890000000009'&&p.storeId==='jardim');const attempts=await Promise.all([1250,1300].map(price=>request('/api/products/update',{...catalogEdit,id:randomUUID(),expectedListingVersion:p.version,expectedProductVersion:p.productVersion,price,minimum:8,reason:'Teste concorrente'})));assert.deepEqual(attempts.map(r=>r.statusCode).sort(),[200,409]);const next=(await request('/api/workspace')).json();const local=next.products.find((x:any)=>x.id===p.id&&x.storeId==='jardim');const remote=next.products.find((x:any)=>x.id===p.id&&x.storeId==='praca');assert([1250,1300].includes(local.price));assert.equal(remote.price,1090);assert.equal(remote.minimum,2);});
 await t.test('persistência após fechar e reabrir banco',async()=>{await app.close();await db.close();db=await openDatabase(directory);({app,auth}=createApp(db,secret,origin));const r=await request('/api/workspace');assert.equal(r.statusCode,200);assert.equal(r.json().history.length,2);assert([26,27].includes(r.json().products.find((p:any)=>p.id===milk.id&&p.storeId==='jardim').stock));const item=r.json().products.find((p:any)=>p.code==='7890000000009'&&p.storeId==='jardim');assert([1250,1300].includes(item.price));assert.equal(item.minimum,8);assert(r.json().listingHistory.some((h:any)=>h.productId===item.id&&h.actor==='Admin'));});
 await t.test('motivo ausente, vazio e espaços preservam auditoria, isolamento e idempotência',async()=>{
  const remoteBefore=(await request('/api/workspace')).json().products.find((p:any)=>p.id===milk.id&&p.storeId==='praca');
  for(const optional of [{},{reason:''},{reason:'   '}]){
   const before=(await request('/api/workspace')).json();
   const product=before.products.find((p:any)=>p.id===milk.id&&p.storeId==='jardim');
   const body={id:randomUUID(),storeId:'jardim',productId:milk.id,expectedVersion:product.version,operation:'count',quantity:product.stock+1,...optional};
   assert.equal((await request('/api/adjustments',body,otherCookie)).statusCode,404);
   assert.equal((await request('/api/adjustments',{...body,storeId:'praca'},opCookie)).statusCode,404);
   assert.equal((await request('/api/adjustments',body,opCookie)).statusCode,200);
   for(const reason of [undefined,'','  '])assert.equal((await request('/api/adjustments',{...body,reason},opCookie)).json().replayed,true);
   assert.equal((await request('/api/adjustments',{...body,reason:'Nova observação'},opCookie)).statusCode,409);
   assert.equal((await request('/api/adjustments',body)).statusCode,409);
   assert.equal((await request('/api/adjustments',{...body,id:randomUUID(),quantity:body.quantity+1},opCookie)).statusCode,409);
   const next=(await request('/api/workspace',undefined,opCookie)).json();
   assert.equal(next.history.length,before.history.length+1);
   const audit=next.history.find((h:any)=>h.id===body.id);
   assert.equal(audit.actor,'Operador');assert.equal(audit.reason,'');
   assert.equal(audit.before,product.stock);assert.equal(audit.after,body.quantity);
   assert(Number.isFinite(Date.parse(audit.at)));
   const stored=(await db.query('SELECT actor_id,reason,request_json FROM movements WHERE network_id=$1 AND id=$2',['demo',body.id])).rows[0];
   assert.equal(stored.actor_id,operator.user.id);assert.equal(stored.reason,'');assert.equal(JSON.parse(stored.request_json).reason,'');
   assert.equal(next.products.find((p:any)=>p.id===milk.id).version,product.version+1);
  }
  const after=(await request('/api/workspace')).json();
  assert.deepEqual(after.products.find((p:any)=>p.id===milk.id&&p.storeId==='praca'),remoteBefore);
  assert.equal((await request('/api/workspace',undefined,otherCookie)).json().history.length,0);
 });
 await t.test('motivo opcional ainda rejeita tipos inválidos e mais de 200 caracteres',async()=>{
  const before=(await request('/api/workspace')).json();
  const product=before.products.find((p:any)=>p.id===milk.id&&p.storeId==='jardim');
  for(const reason of [null,123,{},'a'.repeat(201)])assert.equal((await request('/api/adjustments',{id:randomUUID(),storeId:'jardim',productId:milk.id,expectedVersion:product.version,operation:'count',quantity:1,reason})).statusCode,400);
  assert.deepEqual((await request('/api/workspace')).json(),before);
 });
 await t.test('três operações auditadas, opcionais, isoladas e idempotentes inclusive em reenvio simultâneo',async()=>{
  for(const operation of ['replenishment','loss','count']){
   for(const optional of [{},{reason:''},{reason:'   '}]){
    const before=(await request('/api/workspace')).json();
    const p=before.products.find((p:any)=>p.id===milk.id&&p.storeId==='jardim');
    const quantity=operation==='count'?8:2;
    const after=operation==='count'?quantity:p.stock+(operation==='loss'?-quantity:quantity);
    const body={id:randomUUID(),storeId:'jardim',productId:p.id,expectedVersion:p.version,operation,quantity,...optional};
    assert.equal((await request('/api/adjustments',body,otherCookie)).statusCode,404);
    assert.equal((await request('/api/adjustments',{...body,storeId:'praca'},opCookie)).statusCode,404);
    const repeated=await Promise.all([request('/api/adjustments',body,opCookie),request('/api/adjustments',body,opCookie)]);
    assert.deepEqual(repeated.map(r=>r.statusCode),[200,200]);
    assert.deepEqual(repeated.map(r=>r.json().replayed).sort(),[false,true]);
    assert.equal((await request('/api/adjustments',{...body,reason:''},opCookie)).json().replayed,true);
    assert.equal((await request('/api/adjustments',{...body,quantity:quantity+1},opCookie)).statusCode,409);
    assert.equal((await request('/api/adjustments',{...body,operation:operation==='loss'?'count':'loss'},opCookie)).statusCode,409);
    const next=(await request('/api/workspace')).json();
    const audit=next.history.find((h:any)=>h.id===body.id);
    assert.equal(next.history.length,before.history.length+1);
    assert.equal(audit.operation,operation);assert.equal(audit.delta,after-p.stock);
    assert.equal(audit.before,p.stock);assert.equal(audit.after,after);
    assert.equal(audit.actor,'Operador');assert.equal(audit.reason,'');assert(Number.isFinite(Date.parse(audit.at)));
    const local=next.products.find((x:any)=>x.id===p.id&&x.storeId==='jardim');
    assert.equal(local.stock,after);assert.equal(local.version,p.version+1);
    assert.deepEqual(next.products.filter((x:any)=>x.storeId!=='jardim'),before.products.filter((x:any)=>x.storeId!=='jardim'));
    assert.equal((await request('/api/workspace',undefined,otherCookie)).json().history.length,0);
   }
  }
 });
 await t.test('perda sem saldo e reposição acima do limite não alteram saldo, versão ou histórico',async()=>{
  const before=(await request('/api/workspace')).json();
  const p=before.products.find((p:any)=>p.id===milk.id&&p.storeId==='jardim');
  for(const [operation,quantity] of [['loss',p.stock+1],['replenishment',999999],['loss',0],['replenishment',0]]){
   const result=await request('/api/adjustments',{id:randomUUID(),storeId:p.storeId,productId:p.id,expectedVersion:p.version,operation,quantity});
   assert.equal(result.statusCode,400);
  }
  assert.deepEqual((await request('/api/workspace')).json(),before);
  const zero={id:randomUUID(),storeId:p.storeId,productId:p.id,expectedVersion:p.version,operation:'count',quantity:0};
  assert.equal((await request('/api/adjustments',zero)).statusCode,200);
  const state=(await request('/api/workspace')).json();
  assert.equal(state.products.find((x:any)=>x.id===p.id&&x.storeId===p.storeId).stock,0);
  assert.equal(state.history.find((h:any)=>h.id===zero.id).delta,-p.stock);
  assert.equal((await request('/api/adjustments',{...zero,id:randomUUID(),expectedVersion:p.version+1,operation:'loss',quantity:1})).statusCode,400);
 });
 await t.test('operações diferentes concorrentes rejeitam versão vencida e permitem nova conferência',async()=>{
  const before=(await request('/api/workspace')).json();
  const p=before.products.find((p:any)=>p.id===milk.id&&p.storeId==='jardim');
  const base={storeId:p.storeId,productId:p.id,expectedVersion:p.version};
  const bodies=[{...base,id:randomUUID(),operation:'replenishment',quantity:5},{...base,id:randomUUID(),operation:'count',quantity:12}];
  const results=await Promise.all(bodies.map(b=>request('/api/adjustments',b)));
  assert.deepEqual(results.map(r=>r.statusCode).sort(),[200,409]);
  const next=(await request('/api/workspace')).json();
  const current=next.products.find((x:any)=>x.id===p.id&&x.storeId===p.storeId);
  assert.equal(current.stock,results[0].statusCode===200?p.stock+5:12);
  assert.equal(current.version,p.version+1);assert.equal(next.history.length,before.history.length+1);
  const loser=bodies[results.findIndex(r=>r.statusCode===409)];
  assert.equal((await request('/api/adjustments',{...loser,id:randomUUID(),expectedVersion:current.version})).statusCode,200);
  const final=(await request('/api/workspace')).json();
  assert.equal(final.products.find((x:any)=>x.id===p.id&&x.storeId===p.storeId).stock,loser.operation==='count'?12:current.stock+5);
 });
 await t.test('duas perdas concorrentes não retiram mais que o saldo disponível',async()=>{
  let before=(await request('/api/workspace')).json();
  let p=before.products.find((p:any)=>p.id===milk.id&&p.storeId==='jardim');
  assert.equal((await request('/api/adjustments',{id:randomUUID(),storeId:p.storeId,productId:p.id,expectedVersion:p.version,operation:'count',quantity:5})).statusCode,200);
  before=(await request('/api/workspace')).json();p=before.products.find((p:any)=>p.id===milk.id&&p.storeId==='jardim');
  const bodies=[1,2].map(()=>({id:randomUUID(),storeId:p.storeId,productId:p.id,expectedVersion:p.version,operation:'loss',quantity:4}));
  const results=await Promise.all(bodies.map(b=>request('/api/adjustments',b)));
  assert.deepEqual(results.map(r=>r.statusCode).sort(),[200,409]);
  const loser=bodies[results.findIndex(r=>r.statusCode===409)];
  assert.equal((await request('/api/adjustments',{...loser,expectedVersion:p.version+1})).statusCode,400);
  const next=(await request('/api/workspace')).json();
  assert.equal(next.products.find((x:any)=>x.id===p.id&&x.storeId===p.storeId).stock,1);
  assert.equal(next.history.length,before.history.length+1);
 });
 await t.test('mesmo identificador em lojas diferentes concorre sem deixar atualização parcial',async()=>{
  const before=(await request('/api/workspace')).json();
  const products=before.products.filter((p:any)=>p.id===milk.id);
  const id=randomUUID();
  const bodies=products.map((p:any)=>({id,storeId:p.storeId,productId:p.id,expectedVersion:p.version,operation:'replenishment',quantity:1}));
  const results=await Promise.all(bodies.map((b:any)=>request('/api/adjustments',b)));
  assert.deepEqual(results.map(r=>r.statusCode).sort(),[200,409]);
  const next=(await request('/api/workspace')).json();
  for(let index=0;index<products.length;index++){
   const p=products[index];const updated=next.products.find((x:any)=>x.id===p.id&&x.storeId===p.storeId);
   if(results[index].statusCode===200){assert.equal(updated.stock,p.stock+1);assert.equal(updated.version,p.version+1);}
   else assert.deepEqual(updated,p);
  }
  assert.equal(next.history.length,before.history.length+1);
 });
 await t.test('novos movimentos persistem ao reabrir e reenvio continua idempotente após outros movimentos',async()=>{
  const before=(await request('/api/workspace')).json();
  const p=before.products.find((p:any)=>p.id===milk.id&&p.storeId==='jardim');
  const body={id:randomUUID(),storeId:p.storeId,productId:p.id,expectedVersion:p.version,operation:'replenishment',quantity:2};
  assert.equal((await request('/api/adjustments',body)).statusCode,200);
  assert.equal((await request('/api/adjustments',{...body,id:randomUUID(),expectedVersion:p.version+1,operation:'loss',quantity:1})).statusCode,200);
  const saved=(await request('/api/workspace')).json();
  await app.close();await db.close();db=await openDatabase(directory);({app,auth}=createApp(db,secret,origin));
  assert.equal((await request('/api/adjustments',body)).json().replayed,true);
  assert.deepEqual((await request('/api/workspace')).json(),saved);
 });
 await t.test('logout revoga sessão',async()=>{assert.equal((await request('/api/auth/sign-out',{})).statusCode,200);assert.equal((await request('/api/workspace')).statusCode,401);});
 }finally{await app.close();await db.dropTestSchema();await db.close();}
});
