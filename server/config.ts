import {isIP} from 'node:net';
import type {ProxyMode} from './proxy';

export class ConfigurationError extends Error {}
function invalid(name:string):never { throw new ConfigurationError(`Configuração inválida ou ausente: ${name}.`); }
export function loadConfig(env:NodeJS.ProcessEnv=process.env){
 const production=env.NODE_ENV==='production';
 if(env.NODE_ENV&&!['development','test','production'].includes(env.NODE_ENV))invalid('NODE_ENV');
 const origin=env.PUBLIC_ORIGIN??(production?invalid('PUBLIC_ORIGIN'):'http://127.0.0.1:5174');
 let url:URL;try{url=new URL(origin);}catch{invalid('PUBLIC_ORIGIN');}
 if(url.origin!==origin||url.username||url.password||url.pathname!=='/'||url.search||url.hash||!['http:','https:'].includes(url.protocol)||(production&&url.protocol!=='https:'))invalid('PUBLIC_ORIGIN');
 const portText=env.PORT??(production?'3000':'3001');
 if(!/^\d+$/.test(portText)||Number(portText)<1||Number(portText)>65535)invalid('PORT');
 const host=env.HOST??(production?'::':'127.0.0.1');
 if(!isIP(host)&&host!=='localhost')invalid('HOST');
 const secret=env.BETTER_AUTH_SECRET;
 if(secret!==undefined&&(secret.trim()!==secret||secret.length<32||new Set(secret).size<10))invalid('BETTER_AUTH_SECRET');
 if(production&&!secret)invalid('BETTER_AUTH_SECRET');
 if(production&&!env.DATABASE_URL)invalid('DATABASE_URL');
 const proxyMode=env.TRUSTED_PROXY_MODE??'socket';
 if(!['socket','railway-edge'].includes(proxyMode))invalid('TRUSTED_PROXY_MODE');
 if(env.DATABASE_URL){try{const db=new URL(env.DATABASE_URL);if(!['postgres:','postgresql:'].includes(db.protocol)||!db.hostname||db.pathname==='/')invalid('DATABASE_URL');}catch{invalid('DATABASE_URL');}}
 return {production,origin,port:Number(portText),host,secret,proxyMode:proxyMode as ProxyMode};
}
