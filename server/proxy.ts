import {z} from 'zod';
import {fromNodeHeaders} from 'better-auth/node';
import type {FastifyRequest} from 'fastify';

export type ProxyMode='socket'|'railway-edge';
export const authIpHeader='x-minimercado-client-ip';
const ip=z.union([z.ipv4(),z.ipv6()]);
// Railway mode is an explicit ingress contract: public HTTP edge ONLY, no TCP
// proxy or untrusted private callers. Railway owns/overwrites X-Real-IP there.
// Do not infer proxy CIDRs or hop counts, and never parse client-supplied XFF.
export function clientIp(request:FastifyRequest,mode:ProxyMode):string {
 const value=mode==='railway-edge'?request.headers['x-real-ip']:request.raw.socket.remoteAddress;
 if(typeof value!=='string'||!ip.safeParse(value).success){
  throw Object.assign(new Error('IP de origem indisponível ou inválido para o modo de proxy configurado.'),{statusCode:400});
 }
 return value;
}
export function authRequestHeaders(request:FastifyRequest,mode:ProxyMode){
 const headers=fromNodeHeaders(request.headers);
 for(const name of ['forwarded','x-forwarded-for','x-real-ip',authIpHeader])headers.delete(name);
 headers.set(authIpHeader,clientIp(request,mode));
 return headers;
}
