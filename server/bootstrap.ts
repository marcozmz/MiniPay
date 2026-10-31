import {randomUUID} from 'node:crypto';
import {hashPassword} from 'better-auth/crypto';
import {z} from 'zod';
import type {Database} from './database';

const input=z.object({email:z.string().trim().email().max(254),name:z.string().trim().min(2).max(100),password:z.string().min(12).max(128),networkName:z.string().trim().min(2).max(100),franchiseeName:z.string().trim().min(2).max(100)});
export async function bootstrapAdmin(db:Database,values:unknown){
 const body=input.parse(values),password=await hashPassword(body.password);
 await db.transaction(async tx=>{
  await tx.query('SELECT pg_advisory_xact_lock(51743002)');
  const existing=await tx.query('SELECT 1 FROM "user" UNION ALL SELECT 1 FROM networks LIMIT 1');
  if(existing.rows.length)throw Error('Bootstrap permitido somente em banco sem usuários e redes.');
  const userId=randomUUID(),networkId=randomUUID(),franchiseeId=randomUUID();
  await tx.query('INSERT INTO "user"(id,name,email,"emailVerified",role,banned,"createdAt","updatedAt") VALUES($1,$2,$3,false,\'admin\',false,now(),now())',[userId,body.name,body.email.toLowerCase()]);
  await tx.query('INSERT INTO account(id,"accountId","providerId","userId",password,"createdAt","updatedAt") VALUES($1,$2,\'credential\',$2,$3,now(),now())',[randomUUID(),userId,password]);
  await tx.query('INSERT INTO networks(id,name) VALUES($1,$2)',[networkId,body.networkName]);
  await tx.query('INSERT INTO franchisees(id,network_id,name) VALUES($1,$2,$3)',[franchiseeId,networkId,body.franchiseeName]);
  await tx.query('INSERT INTO memberships(user_id,network_id,role,active,password_setup_required) VALUES($1,$2,\'admin\',true,true)',[userId,networkId]);
 });
}
