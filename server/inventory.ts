import {randomUUID} from 'node:crypto';
import type {Database} from './database';
import {z} from 'zod';
import {calculateStock} from '../src/domain/inventory';
export class HttpError extends Error {constructor(public statusCode:number,message:string,public code?:string){super(message);}}
export type Member={user_id:string;network_id:string;role:'admin'|'operator';active:boolean;password_setup_required:boolean};
const count=z.number().int().min(0).max(999999);
export const adjustmentSchema=z.object({id:z.string().uuid(),storeId:z.string().min(1),productId:z.number().int().positive(),expectedVersion:z.number().int().nonnegative(),operation:z.enum(['replenishment','loss','count']),quantity:count,reason:z.string().trim().max(200).default('')}).strict().refine(b=>b.operation==='count'||b.quantity>0,{message:'Informe uma quantidade maior que zero.',path:['quantity']});
const category=z.enum(['Bebidas','Mercearia','Doces','Higiene']);
export const storeSchema=z.object({name:z.string().trim().min(2).max(80).refine(name=>!name.includes('\uFFFD'),'O nome contém caracteres corrompidos. Digite novamente usando UTF-8.')}).strict();
export const productSchema=z.object({id:z.string().uuid().optional(),storeId:z.string().min(1),name:z.string().trim().min(2).max(100),code:z.string().regex(/^\d{8,14}$/),category,price:z.number().int().min(0).max(99999999),initialStock:count.default(0),minimum:count,reason:z.string().trim().max(200).default('')}).strict();
export const updateProductSchema=z.object({id:z.string().uuid(),productId:z.number().int().positive(),storeId:z.string().min(1),expectedListingVersion:z.number().int().nonnegative(),expectedProductVersion:z.number().int().nonnegative(),name:z.string().trim().min(2).max(100),code:z.string().regex(/^\d{8,14}$/),category,price:z.number().int().min(0).max(99999999),minimum:count,reason:z.string().trim().min(1).max(200)}).strict();
export async function canAccess(db:Database,m:Member,storeId:string){const r=await db.query(`SELECT id FROM stores s WHERE s.network_id=$1 AND s.id=$2 AND ($3='admin' OR EXISTS(SELECT 1 FROM store_access a WHERE a.user_id=$4 AND a.store_id=s.id AND a.network_id=s.network_id))`,[m.network_id,storeId,m.role,m.user_id]);if(!r.rows.length)throw new HttpError(404,'Loja não encontrada.');}
export async function snapshot(db:Database,m:Member){
 const stores=(await db.query(`SELECT s.id,s.name,COUNT(l.product_id)::int AS "productCount",COALESCE(SUM(l.stock),0)::int AS units FROM stores s LEFT JOIN listings l ON l.network_id=s.network_id AND l.store_id=s.id WHERE s.network_id=$1 AND ($2='admin' OR EXISTS(SELECT 1 FROM store_access a WHERE a.user_id=$3 AND a.store_id=s.id AND a.network_id=s.network_id)) GROUP BY s.id,s.name ORDER BY s.name`,[m.network_id,m.role,m.user_id])).rows;
 const ids=stores.map((s:any)=>s.id);
 const products=(await db.query(`SELECT p.id,p.name,p.code,p.category,p.version AS "productVersion",l.price,l.stock,l.minimum,l.version,l.store_id AS "storeId" FROM listings l JOIN products p ON p.id=l.product_id AND p.network_id=l.network_id WHERE l.network_id=$1 AND l.store_id=ANY($2::text[]) ORDER BY p.name`,[m.network_id,ids])).rows;
 const history=(await db.query(`SELECT m.id,m.at,m.store_id AS "storeId",p.name,m.before_stock AS "before",m.after_stock AS "after",m.operation,m.quantity_delta AS delta,m.reason,u.name AS actor FROM movements m JOIN products p ON p.id=m.product_id AND p.network_id=m.network_id JOIN "user" u ON u.id=m.actor_id WHERE m.network_id=$1 AND m.store_id=ANY($2::text[]) ORDER BY m.at DESC LIMIT 200`,[m.network_id,ids])).rows;
 const listingHistory=(await db.query(`SELECT c.id,c.at,c.store_id AS "storeId",c.product_id AS "productId",c.before_values AS "beforeValues",c.after_values AS "afterValues",c.reason,u.name AS actor FROM listing_changes c JOIN "user" u ON u.id=c.actor_id WHERE c.network_id=$1 AND c.store_id=ANY($2::text[]) ORDER BY c.at DESC LIMIT 200`,[m.network_id,ids])).rows;
 return {stores,products,history,listingHistory,role:m.role};
}
export async function adjustStock(db:Database,m:Member,input:unknown){
 const body=adjustmentSchema.parse(input);await canAccess(db,m,body.storeId);
 const serialized=JSON.stringify({...body,actor:m.user_id});
 return db.transaction(async tx=>{
  // Serialize the balance and its audit record in the same database transaction.
  const rows=await tx.query<{stock:number;version:number}>('SELECT stock,version FROM listings WHERE network_id=$1 AND store_id=$2 AND product_id=$3 FOR UPDATE',[m.network_id,body.storeId,body.productId]);
  if(!rows.rows.length)throw new HttpError(404,'Produto não encontrado.');
  const old=await tx.query<{request_json:string}>('SELECT request_json FROM movements WHERE network_id=$1 AND id=$2',[m.network_id,body.id]);
  if(old.rows.length){if(old.rows[0].request_json!==serialized)throw new HttpError(409,'Este identificador já pertence a outro ajuste.');return {replayed:true};}
  const current=rows.rows[0];if(current.version!==body.expectedVersion)throw new HttpError(409,'O saldo mudou. Atualize a lista e confira novamente.');
  let after:number;
  try{after=calculateStock(current.stock,body.operation,body.quantity);}catch(error){throw new HttpError(400,(error as Error).message);}
  await tx.query('UPDATE listings SET stock=$1,version=version+1 WHERE network_id=$2 AND store_id=$3 AND product_id=$4',[after,m.network_id,body.storeId,body.productId]);
  await tx.query('INSERT INTO movements(id,network_id,store_id,product_id,actor_id,before_stock,after_stock,reason,request_json,operation,quantity_delta) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[body.id,m.network_id,body.storeId,body.productId,m.user_id,current.stock,after,body.reason,serialized,body.operation,after-current.stock]);
  return {replayed:false};
 });
}
export async function addProduct(db:Database,m:Member,input:unknown){
 if(m.role!=='admin')throw new HttpError(403,'Somente administradores podem cadastrar produtos.');
 const b=productSchema.parse(input);await canAccess(db,m,b.storeId);
 const requestId=b.id??randomUUID();
 const requestJson=JSON.stringify({...b,actor:m.user_id});
 return db.transaction(async tx=>{
  if(b.id){
   // An absent catalog row cannot be locked with FOR UPDATE. Serialize replays
   // before creating it, then reuse the existing request ledger in listing_changes.
   await tx.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',['product-create:'+m.network_id,b.id]);
   const existing=(await tx.query<{request_json:string;product_id:number}>('SELECT request_json,product_id FROM listing_changes WHERE network_id=$1 AND store_id=$2 AND request_id=$3',[m.network_id,b.storeId,b.id])).rows[0];
   if(existing){if(existing.request_json!==requestJson)throw new HttpError(409,'Este identificador já pertence a outro cadastro.');return {id:existing.product_id,replayed:true};}
  }
  let product=(await tx.query<{id:number;name:string;category:string}>('SELECT id,name,category FROM products WHERE network_id=$1 AND code=$2 FOR UPDATE',[m.network_id,b.code])).rows[0];
  if(product&&(product.name!==b.name||product.category!==b.category))throw new HttpError(409,'Este código já está no catálogo com outros dados. Use os dados cadastrados.');
  if(!product)product=(await tx.query<{id:number;name:string;category:string}>('INSERT INTO products(network_id,name,code,category) VALUES($1,$2,$3,$4) RETURNING id,name,category',[m.network_id,b.name,b.code,b.category])).rows[0];
  const exists=await tx.query('SELECT 1 FROM listings WHERE store_id=$1 AND product_id=$2',[b.storeId,product.id]);
  if(exists.rows.length)throw new HttpError(409,'Produto já cadastrado nesta loja.');
  await tx.query('INSERT INTO listings(network_id,store_id,product_id,price,stock,minimum) VALUES($1,$2,$3,$4,$5,$6)',[m.network_id,b.storeId,product.id,b.price,b.initialStock,b.minimum]);
  const after={name:b.name,code:b.code,category:b.category,price:b.price,stock:b.initialStock,minimum:b.minimum};
  await tx.query('INSERT INTO listing_changes(id,request_id,network_id,store_id,product_id,actor_id,before_values,after_values,reason,request_json) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[randomUUID(),requestId,m.network_id,b.storeId,product.id,m.user_id,JSON.stringify({}),JSON.stringify(after),b.reason,requestJson]);
  if(b.initialStock>0)await tx.query("INSERT INTO movements(id,network_id,store_id,product_id,actor_id,before_stock,after_stock,reason,request_json,operation,quantity_delta) VALUES($1,$2,$3,$4,$5,0,$6,$7,$8,'initial',$6)",[requestId,m.network_id,b.storeId,product.id,m.user_id,b.initialStock,b.reason,requestJson]);
  return {id:product.id,replayed:false};
 });
}
export async function updateProduct(db:Database,m:Member,input:unknown){
 if(m.role!=='admin')throw new HttpError(403,'Somente administradores podem editar produtos e parâmetros da loja.');
 const b=updateProductSchema.parse(input);await canAccess(db,m,b.storeId);
 const requestJson=JSON.stringify({...b,actor:m.user_id});
 return db.transaction(async tx=>{
  const listing=(await tx.query<{price:number;minimum:number;version:number}>('SELECT price,minimum,version FROM listings WHERE network_id=$1 AND store_id=$2 AND product_id=$3 FOR UPDATE',[m.network_id,b.storeId,b.productId])).rows[0];
  if(!listing)throw new HttpError(404,'Produto não encontrado nesta loja.');
  const existing=(await tx.query<{request_json:string}>('SELECT request_json FROM listing_changes WHERE network_id=$1 AND store_id=$2 AND request_id=$3',[m.network_id,b.storeId,b.id])).rows[0];
  if(existing){if(existing.request_json!==requestJson)throw new HttpError(409,'Este identificador já pertence a outra edição.');return {replayed:true};}
  const product=(await tx.query<{name:string;code:string;category:string;version:number}>('SELECT name,code,category,version FROM products WHERE network_id=$1 AND id=$2 FOR UPDATE',[m.network_id,b.productId])).rows[0];
  if(!product)throw new HttpError(404,'Produto não encontrado nesta rede.');
  if(listing.version!==b.expectedListingVersion||product.version!==b.expectedProductVersion)throw new HttpError(409,'O produto ou os parâmetros da loja mudaram. Atualize a lista e confira novamente.');
  const catalogChanged=product.name!==b.name||product.code!==b.code||product.category!==b.category;
  const listingChanged=listing.price!==b.price||listing.minimum!==b.minimum;
  if(!catalogChanged&&!listingChanged)throw new HttpError(400,'Nenhuma alteração foi informada.');
  const listings=(await tx.query<{store_id:string;price:number;minimum:number}>('SELECT store_id,price,minimum FROM listings WHERE network_id=$1 AND product_id=$2',[m.network_id,b.productId])).rows;
  if(catalogChanged)await tx.query('UPDATE products SET name=$1,code=$2,category=$3,version=version+1 WHERE network_id=$4 AND id=$5',[b.name,b.code,b.category,m.network_id,b.productId]);
  await tx.query('UPDATE listings SET price=$1,minimum=$2,version=version+1 WHERE network_id=$3 AND store_id=$4 AND product_id=$5',[b.price,b.minimum,m.network_id,b.storeId,b.productId]);
  const before={name:product.name,code:product.code,category:product.category,price:listing.price,minimum:listing.minimum};
  const after={name:b.name,code:b.code,category:b.category,price:b.price,minimum:b.minimum};
  if(catalogChanged){
   for(const row of listings){const oldValues={name:product.name,code:product.code,category:product.category,price:row.price,minimum:row.minimum};const newValues={name:b.name,code:b.code,category:b.category,price:row.store_id===b.storeId?b.price:row.price,minimum:row.store_id===b.storeId?b.minimum:row.minimum};await tx.query('INSERT INTO listing_changes(id,request_id,network_id,store_id,product_id,actor_id,before_values,after_values,reason,request_json) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[randomUUID(),b.id,m.network_id,row.store_id,b.productId,m.user_id,JSON.stringify(oldValues),JSON.stringify(newValues),b.reason,requestJson]);}
  }else await tx.query('INSERT INTO listing_changes(id,request_id,network_id,store_id,product_id,actor_id,before_values,after_values,reason,request_json) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[randomUUID(),b.id,m.network_id,b.storeId,b.productId,m.user_id,JSON.stringify(before),JSON.stringify(after),b.reason,requestJson]);
  return {replayed:false};
 });
}
export async function addStore(db:Database,m:Member,input:unknown){
 if(m.role!=='admin')throw new HttpError(403,'Somente administradores podem cadastrar lojas.');
 const b=storeSchema.parse(input);
 const franchisee=(await db.query<{id:string}>('SELECT id FROM franchisees WHERE network_id=$1 ORDER BY id LIMIT 1',[m.network_id])).rows[0];
 if(!franchisee)throw new HttpError(409,'Cadastre o franqueado antes da loja.');
 const id=randomUUID();await db.query('INSERT INTO stores(id,network_id,franchisee_id,name) VALUES($1,$2,$3,$4)',[id,m.network_id,franchisee.id,b.name]);return {id};
}
