import {openDatabase,type Database} from './database';
import {bootstrapAdmin} from './bootstrap';
import {loadConfig,ConfigurationError} from './config';

let db:Database|undefined;
try{
 loadConfig();const command=process.argv[2];
 if(command!=='migrate'&&command!=='bootstrap-admin')throw Error('Comando inválido.');
 db=await openDatabase('minimercado',{migrate:command==='migrate'});
 if(command==='bootstrap-admin')await bootstrapAdmin(db,{
  email:process.env.BOOTSTRAP_ADMIN_EMAIL,name:process.env.BOOTSTRAP_ADMIN_NAME,password:process.env.BOOTSTRAP_ADMIN_PASSWORD,
  networkName:process.env.BOOTSTRAP_NETWORK_NAME,franchiseeName:process.env.BOOTSTRAP_FRANCHISEE_NAME,
 });
 console.log(command==='migrate'?'Migrações concluídas.':'Administrador inicial criado. Troca de senha obrigatória no primeiro acesso.');
}catch(error){
 console.error(error instanceof ConfigurationError?error.message:'Comando não concluído. Confira configuração, migrações e pré-condições do banco.');process.exitCode=1;
}finally{await db?.close();}
