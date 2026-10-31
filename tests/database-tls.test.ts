import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createServer as netServer,type Socket} from 'node:net';
import {createServer as tlsServer,type TLSSocket} from 'node:tls';
import {once} from 'node:events';
import {Client} from 'pg';
import {databaseConnectionOptions} from '../server/database-config';

test('configuração PostgreSQL não permite sobrescrever TLS/host por URL e preserva local',async()=>{
 const local='postgresql://fixture:fixture@127.0.0.1/test',remote='postgresql://fixture:fixture@db.example.test/test';
 assert.equal((await databaseConnectionOptions(local,{})).ssl,false);
 for(const env of [{},{NODE_ENV:'production'}]){
  const options=await databaseConnectionOptions(remote,env);assert.equal(options.host,'db.example.test');
  assert.equal((options.ssl as any).rejectUnauthorized,true);assert.equal((options.ssl as any).minVersion,'TLSv1.2');
 }
 assert.equal((await databaseConnectionOptions(local,{NODE_ENV:'production'})).ssl!==false,true);
 await assert.rejects(databaseConnectionOptions(local+'?sslmode=require',{}),/DATABASE_TLS_MODE/);
 for(const query of ['ssl=no-verify','ssl=0','sslmode=disable','sslmode=no-verify','sslrootcert=bad','uselibpqcompat=true','host=127.0.0.1','options=-c%20search_path=public','sslnegotiation=direct'])await assert.rejects(databaseConnectionOptions(remote+'?'+query,{}),/DATABASE_URL/);
 assert.equal((await databaseConnectionOptions(remote+'?sslmode=require',{})).ssl!==false,true);
 await assert.rejects(databaseConnectionOptions(remote,{DATABASE_TLS_MODE:'disable-local'}),/DATABASE_TLS_MODE/);
 await assert.rejects(databaseConnectionOptions(remote,{DATABASE_TLS_MODE:'false'}),/DATABASE_TLS_MODE/);
 await assert.rejects(databaseConnectionOptions(remote,{DATABASE_CA_PEM:'malformed-certificate'}),/DATABASE_CA/);
 await assert.rejects(databaseConnectionOptions(remote,{DATABASE_CA_PEM:'fixture',DATABASE_CA_FILE:'fixture'}),/escolha apenas um/);
 await assert.rejects(databaseConnectionOptions(remote,{DATABASE_CA_FILE:'missing-test-ca-file.pem'}),/DATABASE_CA_FILE/);
});

test('pg negocia TLS e valida CA, hostname e validade sem fallback para texto puro',async t=>{
 const directory=resolve('.local',`tls-fixtures-${randomUUID()}`);await mkdir(directory,{recursive:true});
 const file=(name:string)=>join(directory,name);
 const openssl=process.env.TEST_OPENSSL_BIN??(process.platform==='win32'?'C:/Program Files/Git/usr/bin/openssl.exe':'openssl');
 const run=async(args:string[])=>{try{await promisify(execFile)(openssl,args,{windowsHide:true});}catch{throw Error('Falha ao gerar certificados fictícios com OpenSSL. Configure TEST_OPENSSL_BIN se necessário.');}};
 await writeFile(file('ca.cnf'),'[req]\ndistinguished_name=dn\nx509_extensions=ca\nprompt=no\n[dn]\nCN=Minimercado TEST ONLY CA\n[ca]\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\n');
 await writeFile(file('leaf.cnf'),'[server]\nsubjectAltName=DNS:localhost\nbasicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n');
 await run(['req','-new','-newkey','rsa:2048','-nodes','-x509','-days','2','-config',file('ca.cnf'),'-keyout',file('ca.key'),'-out',file('ca.pem')]);
 await run(['req','-new','-x509','-days','2','-config',file('ca.cnf'),'-subj','/CN=Wrong TEST ONLY CA','-key',file('ca.key'),'-out',file('wrong-ca.pem')]);
 await run(['req','-new','-newkey','rsa:2048','-nodes','-subj','/CN=localhost','-config',file('ca.cnf'),'-keyout',file('server.key'),'-out',file('server.csr')]);
 for(const [name,days] of [['server.pem','2'],['expired.pem','-1']])await run(['x509','-req','-in',file('server.csr'),'-CA',file('ca.pem'),'-CAkey',file('ca.key'),'-CAcreateserial','-days',days,'-extfile',file('leaf.cnf'),'-extensions','server','-out',file(name)]);
 const ca=await readFile(file('ca.pem'),'utf8'),wrongCa=await readFile(file('wrong-ca.pem'),'utf8');
 // This is a local protocol fixture, NOT a full PostgreSQL database. It accepts
 // PostgreSQL SSLRequest, then does a real TLS handshake through the pg driver.
 async function fixture(certName='server.pem',supportsTls=true){
  const sockets=new Set<Socket>();
  const encrypted=tlsServer({key:await readFile(file('server.key')),cert:await readFile(file(certName))},socket=>{
   socket.once('data',()=>socket.write(Buffer.from([82,0,0,0,8,0,0,0,0,90,0,0,0,5,73]))); // AuthenticationOk + ReadyForQuery
   let startup=true;socket.on('data',()=>{if(startup){startup=false;return;}socket.end();});
  });
  encrypted.on('tlsClientError',()=>undefined);
  const server=netServer(socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));socket.on('error',()=>undefined);
   socket.once('data',packet=>{const buffer=Buffer.isBuffer(packet)?packet:Buffer.from(packet);assert.equal(buffer.readUInt32BE(0),8);assert.equal(buffer.readUInt32BE(4),80877103);socket.write(supportsTls?'S':'N');if(supportsTls)encrypted.emit('connection',socket);else socket.end();});
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');const port=(server.address() as any).port as number;
  return {port,close:async()=>{for(const socket of sockets)socket.destroy();await new Promise<void>((done,reject)=>server.close(error=>error?reject(error):done()));}};
 }
 async function connect(port:number,host:string,env:NodeJS.ProcessEnv){
  const options=await databaseConnectionOptions(`postgresql://fixture:fixture@${host}:${port}/fixture`,{NODE_ENV:'production',...env});
  const client=new Client({...options,connectionTimeoutMillis:3000});
  try{await client.connect();assert.equal(((client as any).connection.stream as TLSSocket).authorized,true);}finally{await client.end();}
 }
 const valid=await fixture();
 try{
  await t.test('CA em arquivo autoriza certificado e hostname correspondentes',()=>connect(valid.port,'localhost',{DATABASE_CA_FILE:file('ca.pem')}));
  await t.test('CA PEM injetada no ambiente também funciona',()=>connect(valid.port,'localhost',{DATABASE_CA_PEM:ca}));
  await t.test('CA ausente ou errada é recusada',async()=>{for(const env of [{},{DATABASE_CA_PEM:wrongCa}])await assert.rejects(connect(valid.port,'localhost',env),error=>['UNABLE_TO_VERIFY_LEAF_SIGNATURE','SELF_SIGNED_CERT_IN_CHAIN','UNABLE_TO_GET_ISSUER_CERT_LOCALLY'].includes((error as any).code));});
  await t.test('CA confiável não libera hostname divergente',()=>assert.rejects(connect(valid.port,'127.0.0.1',{DATABASE_CA_PEM:ca}),{code:'ERR_TLS_CERT_ALTNAME_INVALID'}));
 }finally{await valid.close();}
 const expired=await fixture('expired.pem');try{await t.test('certificado expirado é recusado',()=>assert.rejects(connect(expired.port,'localhost',{DATABASE_CA_PEM:ca}),{code:'CERT_HAS_EXPIRED'}));}finally{await expired.close();}
 const plaintext=await fixture('server.pem',false);try{await t.test('servidor sem TLS é recusado, sem fallback',()=>assert.rejects(connect(plaintext.port,'localhost',{DATABASE_CA_PEM:ca}),/does not support SSL/));}finally{await plaintext.close();}
});
