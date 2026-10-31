import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {Pool} from 'pg';

const source=new URL((process.env.DATABASE_URL??await readFile('.local/database-url','utf8')).trim());
const scope=process.argv[2];if(scope&&!['proxy','tls'].includes(scope))throw Error('Escopo inválido. Use proxy ou tls.');
if(!['localhost','127.0.0.1','[::1]'].includes(source.hostname))throw Error('Esta verificação exige PostgreSQL local.');
const name=`minimercado_security_${new Date().toISOString().replace(/\D/g,'').slice(0,14)}_${randomBytes(3).toString('hex')}`;
const pool=new Pool({connectionString:source.toString(),connectionTimeoutMillis:10000});
try{await pool.query(`CREATE DATABASE "${name}"`);}catch{throw Error('Não foi possível criar banco separado de segurança. Confira PostgreSQL local/CREATEDB.');}finally{await pool.end();}
console.log(`Banco separado criado e preservado: ${name}`);source.pathname=`/${name}`;
const env={...process.env,NODE_ENV:'test',DATABASE_URL:source.toString(),DATABASE_TLS_MODE:'disable-local'};
delete env.DATABASE_CA_FILE;delete env.DATABASE_CA_PEM;
const files=scope==='proxy'?['tests/proxy.test.ts']:scope==='tls'?['tests/database-tls.test.ts']:['tests/proxy.test.ts','tests/database-tls.test.ts'];
const child=spawn(process.execPath,['--require','./scripts/node-windows-compat.cjs','--import','tsx','--test',...files],{env,stdio:'inherit',windowsHide:true});
const [code]=await once(child,'exit');process.exitCode=code??1;
