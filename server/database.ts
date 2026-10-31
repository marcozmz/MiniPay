import {Pool,type PoolClient,type QueryResultRow} from 'pg';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {databaseConnectionOptions} from './database-config';
export const migrationFiles=['001_initial.sql','002_catalog_audit.sql','003_demo_categories.sql','004_user_access.sql','005_stock_operations.sql','006_initial_stock.sql'] as const;
export interface SqlExecutor {query<T extends QueryResultRow=QueryResultRow>(sql:string,params?:unknown[]):Promise<{rows:T[]}>;exec(sql:string):Promise<void>}
export type Database=SqlExecutor&{pool:Pool;transaction<T>(fn:(tx:SqlExecutor)=>Promise<T>):Promise<T>;close():Promise<void>;dropTestSchema():Promise<void>};
export async function openDatabase(schema='minimercado',options:{migrate?:boolean}={}):Promise<Database>{
 if(!/^(minimercado|test_[a-f0-9]{32})$/.test(schema))throw Error('Schema não permitido.');
 const connectionString=process.env.DATABASE_URL??(process.env.NODE_ENV==='production'?(()=>{throw Error('DATABASE_URL obrigatória.');})():await readFile(resolve('.local/database-url'),'utf8').catch(()=>{throw Error('Banco não configurado. Execute npm run db:up com Docker aberto.');}));
 const connection=await databaseConnectionOptions(connectionString);
 const pool=new Pool({...connection,max:5,connectionTimeoutMillis:10000,options:`-c search_path=${schema}`});
 pool.on('error',()=>{console.error('Conexão ociosa com o banco indisponível.');});
 const executor=(client:Pool|PoolClient):SqlExecutor=>({query:<T extends QueryResultRow=QueryResultRow>(sql:string,params?:unknown[])=>client.query<T>(sql,params),exec:async sql=>{await client.query(sql);}});
 const db:Database={...executor(pool),pool,transaction:async fn=>{const client=await pool.connect();try{await client.query('BEGIN');const result=await fn(executor(client));await client.query('COMMIT');return result;}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}},close:()=>pool.end(),dropTestSchema:async()=>{if(!/^test_[a-f0-9]{32}$/.test(schema))throw Error('Somente schemas temporários de teste podem ser removidos.');await pool.query(`DROP SCHEMA "${schema}" CASCADE`);}};
 try{if(options.migrate===false){await assertDatabaseReady(db);return db;}
 await db.transaction(async tx=>{
  await tx.query('SELECT pg_advisory_xact_lock(51743001)');
  await tx.exec(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await tx.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  for(const [index,file] of migrationFiles.entries()){
   const version=index+1;
   const found=await tx.query('SELECT version FROM schema_migrations WHERE version=$1',[version]);
   if(!found.rows.length){await tx.exec(await readFile(new URL(`./migrations/${file}`,import.meta.url),'utf8'));await tx.query('INSERT INTO schema_migrations(version) VALUES ($1)',[version]);}
  }
 });return db;
 }catch(e){await pool.end();throw e;}
}
export async function assertDatabaseReady(db:SqlExecutor){
 const versions=(await db.query<{version:number}>('SELECT version FROM schema_migrations ORDER BY version')).rows.map(row=>row.version);
 if(JSON.stringify(versions)!==JSON.stringify(migrationFiles.map((_,i)=>i+1)))throw Error('Migrações pendentes ou incompatíveis. Execute npm run db:migrate.');
 await db.query('SELECT 1 FROM memberships LIMIT 0');
}
