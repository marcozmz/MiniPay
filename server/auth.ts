import {betterAuth} from 'better-auth';
import {admin} from 'better-auth/plugins';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {drizzle} from 'drizzle-orm/node-postgres';
import type {Database} from './database';
import * as schema from './auth-schema';
import {authIpHeader} from './proxy';
export function createAuth(db:Database,secret:string,origin:string){return betterAuth({
 database:drizzleAdapter(drizzle(db.pool),{provider:'pg',schema}),
 plugins:[admin({defaultRole:'user',adminRoles:['admin'],bannedUserMessage:'Esta conta foi desativada. Fale com o administrador da rede.'})],
 secret,baseURL:origin,trustedOrigins:[origin],
 emailAndPassword:{enabled:true,minPasswordLength:12},
 session:{expiresIn:60*60*8,updateAge:60*30},
 rateLimit:{enabled:true,storage:'memory',window:60,max:30,customRules:{'/sign-in/email':{window:60,max:5}}},
 logger:{disabled:true},
 advanced:{useSecureCookies:origin.startsWith('https://'),ipAddress:{ipAddressHeaders:[authIpHeader],ipv6Subnet:64},defaultCookieAttributes:{httpOnly:true,sameSite:'lax',secure:origin.startsWith('https://')}},
});}
