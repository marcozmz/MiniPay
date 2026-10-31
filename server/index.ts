import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {openDatabase,type Database} from './database';
import {createApp} from './app';
import {loadConfig,ConfigurationError} from './config';
import {serveFrontend} from './static';

let db:Database|undefined;
let app:ReturnType<typeof createApp>['app']|undefined;
let stopping=false;
let stage='configuração';
async function shutdown(){
 if(stopping)return;stopping=true;
 const deadline=setTimeout(()=>{console.error('Prazo de encerramento excedido.');process.exit(1);},10000);deadline.unref();
 try{await app?.close();}finally{try{await db?.close();}finally{clearTimeout(deadline);}}
}
try{
 const config=loadConfig();let secret=config.secret;
 if(!secret){
  await mkdir(resolve('.local'),{recursive:true});
  try{secret=await readFile(resolve('.local/auth-secret'),'utf8');}catch(e){
   if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;
   secret=randomBytes(48).toString('base64url');await writeFile(resolve('.local/auth-secret'),secret,{flag:'wx',mode:0o600});
  }
 }
 stage='banco/migrações';db=await openDatabase('minimercado',{migrate:false});
 ({app}=createApp(db,secret,config.origin,config.proxyMode));
 stage='frontend';if(fileURLToPath(import.meta.url).endsWith('.js'))await serveFrontend(app,fileURLToPath(new URL('../../dist/',import.meta.url)));
 for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>{void shutdown().catch(()=>{console.error('Falha ao encerrar conexões.');process.exitCode=1;});});
 stage='porta de escuta';await app.listen({host:config.host,port:config.port});
 console.log('Servidor pronto.');
}catch(error){
 const code=(error as NodeJS.ErrnoException)?.code;
 console.error(error instanceof ConfigurationError?error.message:`Inicialização falhou em ${stage}${code&&/^[A-Z0-9_]+$/.test(code)?` (${code})`:''}. Confira a configuração.`);
 await shutdown().catch(()=>undefined);process.exitCode=1;
}
