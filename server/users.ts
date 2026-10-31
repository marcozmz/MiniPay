import { randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Database } from './database';
import { HttpError, type Member } from './inventory';

const ids = z.array(z.string().min(1)).min(1).max(100).refine(values => new Set(values).size === values.length, 'Lojas repetidas.');
const createSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254), storeIds: ids }).strict();
const accessSchema = z.object({ userId: z.string().min(1), storeIds: ids }).strict();
const deactivateSchema = z.object({ userId: z.string().min(1) }).strict();

function requireAdmin(member: Member) {
  if (member.role !== 'admin') throw new HttpError(403, 'Somente administradores da rede podem gerenciar operadores.');
}

async function validateStores(db: Database, member: Member, storeIds: string[]) {
  const found = await db.query<{ id: string }>('SELECT id FROM stores WHERE network_id=$1 AND id=ANY($2::text[])', [member.network_id, storeIds]);
  if (found.rows.length !== storeIds.length) throw new HttpError(404, 'Uma ou mais lojas não pertencem à sua rede.');
}

export async function listOperators(db: Database, member: Member) {
  requireAdmin(member);
  const users = await db.query(`SELECT m.user_id AS "userId",u.name,u.email,(m.active AND NOT COALESCE(u.banned,false)) AS active,m.password_setup_required AS "passwordSetupRequired",COALESCE(array_agg(a.store_id ORDER BY a.store_id) FILTER (WHERE a.store_id IS NOT NULL),'{}') AS "storeIds" FROM memberships m JOIN "user" u ON u.id=m.user_id LEFT JOIN store_access a ON a.network_id=m.network_id AND a.user_id=m.user_id WHERE m.network_id=$1 AND m.role='operator' GROUP BY m.user_id,u.name,u.email,m.active,u.banned,m.password_setup_required ORDER BY u.name`, [member.network_id]);
  const history = await db.query(`SELECT h.id,h.action,h.before_state AS "beforeState",h.after_state AS "afterState",h.at,a.name AS actor,t.name AS target_name,t.email AS target_email FROM access_history h JOIN "user" a ON a.id=h.actor_id JOIN "user" t ON t.id=h.target_user_id WHERE h.network_id=$1 ORDER BY h.at DESC LIMIT 200`, [member.network_id]);
  return { users: users.rows, history: history.rows };
}

export async function createOperator(db: Database, auth: any, member: Member, input: unknown) {
  requireAdmin(member);
  const body = createSchema.parse(input);
  const storeIds = [...body.storeIds].sort();
  await validateStores(db, member, storeIds);
  const initialPassword = randomBytes(24).toString('base64url');
  let created: { user: { id: string; name: string; email: string } };
  try {
    created = await auth.api.createUser({ body: { name: body.name, email: body.email.toLowerCase(), password: initialPassword, role: 'user' } });
  } catch {
    throw new HttpError(409, 'Não foi possível criar esta conta. Confira se o e-mail já está cadastrado.');
  }
  try {
    await db.transaction(async tx => {
      await tx.query("INSERT INTO memberships(user_id,network_id,role,active,password_setup_required) VALUES($1,$2,'operator',true,true)", [created.user.id, member.network_id]);
      for (const storeId of storeIds) await tx.query('INSERT INTO store_access(network_id,user_id,store_id) VALUES($1,$2,$3)', [member.network_id, created.user.id, storeId]);
      await tx.query('INSERT INTO access_history(id,network_id,actor_id,target_user_id,action,before_state,after_state) VALUES($1,$2,$3,$4,$5,$6,$7)', [randomUUID(), member.network_id, member.user_id, created.user.id, 'operator_created', JSON.stringify({ active: false, storeIds: [] }), JSON.stringify({ active: true, role: 'operator', storeIds })]);
    });
  } catch {
    await auth.api.removeUser({ body: { userId: created.user.id } }).catch(() => undefined);
    throw new HttpError(409, 'Não foi possível concluir o cadastro do operador.');
  }
  return { user: { userId: created.user.id, name: created.user.name, email: created.user.email, active: true, storeIds }, initialPassword };
}

export async function updateOperatorStores(db: Database, member: Member, input: unknown) {
  requireAdmin(member);
  const body = accessSchema.parse(input);
  const storeIds = [...body.storeIds].sort();
  await validateStores(db, member, storeIds);
  return db.transaction(async tx => {
    const target = await tx.query<{ user_id: string }>("SELECT user_id FROM memberships WHERE network_id=$1 AND user_id=$2 AND role='operator' AND active=true FOR UPDATE", [member.network_id, body.userId]);
    if (!target.rows.length) throw new HttpError(404, 'Operador ativo não encontrado nesta rede.');
    const old = await tx.query<{ store_id: string }>('SELECT store_id FROM store_access WHERE network_id=$1 AND user_id=$2 ORDER BY store_id', [member.network_id, body.userId]);
    const before = old.rows.map(row => row.store_id);
    if (JSON.stringify(before) === JSON.stringify(storeIds)) return { changed: false };
    await tx.query('DELETE FROM store_access WHERE network_id=$1 AND user_id=$2', [member.network_id, body.userId]);
    for (const storeId of storeIds) await tx.query('INSERT INTO store_access(network_id,user_id,store_id) VALUES($1,$2,$3)', [member.network_id, body.userId, storeId]);
    await tx.query('INSERT INTO access_history(id,network_id,actor_id,target_user_id,action,before_state,after_state) VALUES($1,$2,$3,$4,$5,$6,$7)', [randomUUID(), member.network_id, member.user_id, body.userId, 'stores_changed', JSON.stringify({ active: true, storeIds: before }), JSON.stringify({ active: true, storeIds })]);
    return { changed: true };
  });
}

export async function deactivateOperator(db: Database, auth: any, member: Member, input: unknown, headers: Headers) {
  requireAdmin(member);
  const { userId } = deactivateSchema.parse(input);
  return db.transaction(async tx => {
    const target = await tx.query<{ user_id: string }>("SELECT user_id FROM memberships WHERE network_id=$1 AND user_id=$2 AND role='operator' AND active=true FOR UPDATE", [member.network_id, userId]);
    if (!target.rows.length) throw new HttpError(404, 'Operador ativo não encontrado nesta rede.');
    const old = await tx.query<{ store_id: string }>('SELECT store_id FROM store_access WHERE network_id=$1 AND user_id=$2 ORDER BY store_id', [member.network_id, userId]);
    const before = old.rows.map(row => row.store_id);
    try {
      await auth.api.banUser({ body: { userId, banReason: 'Acesso desativado pelo administrador da rede.' }, headers });
    } catch {
      throw new HttpError(409, 'O Better Auth não conseguiu revogar as sessões; a conta não foi desativada.');
    }
    await tx.query('UPDATE memberships SET active=false,password_setup_required=false WHERE network_id=$1 AND user_id=$2', [member.network_id, userId]);
    await tx.query('DELETE FROM store_access WHERE network_id=$1 AND user_id=$2', [member.network_id, userId]);
    await tx.query('INSERT INTO access_history(id,network_id,actor_id,target_user_id,action,before_state,after_state) VALUES($1,$2,$3,$4,$5,$6,$7)', [randomUUID(), member.network_id, member.user_id, userId, 'operator_deactivated', JSON.stringify({ active: true, storeIds: before }), JSON.stringify({ active: false, storeIds: [] })]);
    return { deactivated: true };
  });
}

const firstPasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(12).max(128) }).strict();
export async function completeFirstAccess(db: Database, auth: any, member: Member, input: unknown, headers: Headers) {
  if (!member.active) throw new HttpError(403, 'Conta desativada.');
  if (!member.password_setup_required) throw new HttpError(409, 'A conta não está aguardando a troca de senha inicial.');
  const body = firstPasswordSchema.parse(input);
  try {
    await auth.api.changePassword({ body, headers });
    await auth.api.revokeOtherSessions({ headers });
  } catch {
    throw new HttpError(400, 'Não foi possível trocar a senha. Confira a senha inicial e os requisitos da nova senha.');
  }
  await db.query('UPDATE memberships SET password_setup_required=false WHERE network_id=$1 AND user_id=$2 AND active=true', [member.network_id, member.user_id]);
  return { changed: true };
}
