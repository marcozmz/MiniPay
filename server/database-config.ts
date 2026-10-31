import {readFile} from 'node:fs/promises';
import {X509Certificate} from 'node:crypto';
import {checkServerIdentity,type ConnectionOptions} from 'node:tls';
import type {PoolConfig} from 'pg';
import {ConfigurationError} from './config';

function invalid(name:string):never{throw new ConfigurationError(`Configuração inválida ou ausente: ${name}.`);}
export async function databaseConnectionOptions(connectionString:string,env:NodeJS.ProcessEnv=process.env):Promise<PoolConfig>{
 let url:URL;try{url=new URL(connectionString.trim());}catch{invalid('DATABASE_URL');}
 if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname||url.pathname.length<2)invalid('DATABASE_URL');
 // pg-connection-string lets query parameters override host and the entire ssl
 // object (including rejectUnauthorized). Never pass an unfiltered URL to pg.
 for(const [key,value] of url.searchParams){
  if(key==='sslmode'&&['require','verify-full'].includes(value))continue; // strict TLS still enforced below
  if(key==='application_name')continue;
  invalid('DATABASE_URL (parâmetros não permitidos)');
 }
 const host=url.hostname.replace(/^\[|\]$/g,'');
 const loopback=['localhost','127.0.0.1','::1'].includes(host);
 const mode=env.DATABASE_TLS_MODE??(env.NODE_ENV==='production'||!loopback?'verify-full':'disable-local');
 if(!['verify-full','disable-local'].includes(mode)||mode==='disable-local'&&!loopback)invalid('DATABASE_TLS_MODE');
 if(mode==='disable-local'&&url.searchParams.has('sslmode'))invalid('DATABASE_TLS_MODE (URL exige TLS)');
 if(env.DATABASE_CA_FILE&&env.DATABASE_CA_PEM)invalid('DATABASE_CA_FILE/DATABASE_CA_PEM (escolha apenas um)');
 let ca=env.DATABASE_CA_PEM;
 if(env.DATABASE_CA_FILE){try{ca=await readFile(env.DATABASE_CA_FILE,'utf8');}catch{invalid('DATABASE_CA_FILE');}}
 if(ca!==undefined){
  if(mode!=='verify-full')invalid('DATABASE_TLS_MODE (CA exige TLS)');
  try{
   const certificates=ca.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g);
   if(!certificates?.length||ca.replace(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g,'').trim())throw Error();
   for(const certificate of certificates)new X509Certificate(certificate);
  }catch{invalid('DATABASE_CA_FILE/DATABASE_CA_PEM');}
 }
 const ssl:ConnectionOptions|false=mode==='disable-local'?false:{rejectUnauthorized:true,minVersion:'TLSv1.2',...(ca?{ca}:{}),checkServerIdentity:(_server,certificate)=>checkServerIdentity(host,certificate)};
 let user:string,password:string,database:string;
 try{user=decodeURIComponent(url.username);password=decodeURIComponent(url.password);database=decodeURIComponent(url.pathname.slice(1));}catch{invalid('DATABASE_URL');}
 if(!user||!database||database.includes('/'))invalid('DATABASE_URL');
 return {host,port:url.port?Number(url.port):5432,user,password,database,ssl,application_name:url.searchParams.get('application_name')??'minimercado',sslnegotiation:'postgres'};
}
