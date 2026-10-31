import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
await mkdir('.local',{recursive:true});
let password;
try{password=(await readFile('.local/postgres.env','utf8')).trim().split('=')[1];}catch{password=randomBytes(24).toString('hex');await writeFile('.local/postgres.env',`POSTGRES_PASSWORD=${password}\n`,{flag:'wx',mode:0o600});}
await writeFile('.local/database-url',`postgresql://minimercado:${password}@127.0.0.1:5433/minimercado`,{mode:0o600});
const action=process.argv[2]??'up';if(!['up','stop'].includes(action))throw Error('Ação inválida.');
const child=spawn('docker',['compose','--env-file','.local/postgres.env',...(action==='up'?['up','-d','--wait']:['stop'])],{stdio:'inherit',windowsHide:true});
child.on('error',()=>{console.error('Docker indisponível. Abra o Docker Desktop e tente novamente.');process.exitCode=1;});child.on('exit',code=>{process.exitCode=code??1;});
