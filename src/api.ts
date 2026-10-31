import type {State} from './domain/inventory';
import { offlineMessage } from './pwa';
export type Workspace=State&{stores:{id:string;name:string;productCount:number;units:number}[];role:'admin'|'operator';user:{name:string;email:string}};
export class ApiError extends Error {constructor(public status:number,message:string){super(message);}}
export async function api<T>(path:string,body?:unknown):Promise<T>{
 if(typeof navigator!=='undefined'&&navigator.onLine===false)throw new ApiError(0,offlineMessage);
 let response:Response;
 try{response=await fetch('/api'+path,{method:body===undefined?'GET':'POST',cache:'no-store',credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});}catch{throw new ApiError(0,'Não foi possível confirmar a resposta do servidor. Confira a conexão e consulte o saldo e o histórico antes de tentar novamente.');}
 const payload=await response.json().catch(()=>({}));
 if(!response.ok)throw new ApiError(response.status,payload.error?.message??payload.error??payload.message??'Não foi possível concluir.');
 return payload as T;
}
export async function downloadCsv(storeId:string):Promise<{blob:Blob;filename:string}>{
 if(typeof navigator!=='undefined'&&navigator.onLine===false)throw new ApiError(0,offlineMessage);
 let response:Response;
 try{response=await fetch(`/api/export.csv?storeId=${encodeURIComponent(storeId)}`,{cache:'no-store',credentials:'same-origin'});}catch{throw new ApiError(0,'Não foi possível conectar ao servidor.');}
 if(!response.ok){const payload=await response.json().catch(()=>({}));throw new ApiError(response.status,payload.error??'Não foi possível exportar esta loja.');}
 const disposition=response.headers.get('Content-Disposition')??'';const filename=/filename="([^"]+)"/i.exec(disposition)?.[1]??'estoque.csv';
 return {blob:await response.blob(),filename};
}
