import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from './api';

type Store = { id: string; name: string };
type Operator = { userId: string; name: string; email: string; active: boolean; passwordSetupRequired: boolean; storeIds: string[] };
type AccessEvent = { id: string; action: string; beforeState: { active?: boolean; storeIds?: string[] }; afterState: { active?: boolean; storeIds?: string[] }; at: string; actor: string; target_name: string; target_email: string };
type UserList = { users: Operator[]; history: AccessEvent[] };
type CreatedUser = { user: Operator; initialPassword: string };

export function UserManagement({ stores }: { stores: Store[] }) {
  const [data, setData] = useState<UserList>({ users: [], history: [] });
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [initialCredential, setInitialCredential] = useState<CreatedUser | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyUser, setBusyUser] = useState('');

  const refresh = useCallback(async () => {
    const next = await api<UserList>('/users');
    setData(next);
    setAssignments(Object.fromEntries(next.users.map(user => [user.userId, user.storeIds])));
  }, []);
  useEffect(() => { void refresh().catch(cause => setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os operadores.')); }, [refresh]);

  const storeNames = (ids: string[] = []) => ids.map(id => stores.find(store => store.id === id)?.name ?? id).join(', ') || 'Nenhuma loja';
  const accessText = (state: AccessEvent['afterState']) => `${state.active ? 'Ativo' : 'Desativado'} · ${storeNames(state.storeIds)}`;

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const fields = new FormData(form); const storeIds = fields.getAll('new-store').map(String);
    if (!storeIds.length) { setError('Selecione ao menos uma loja.'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      const created = await api<CreatedUser>('/users', { name: String(fields.get('name')), email: String(fields.get('email')), storeIds });
      setInitialCredential(created); form.reset(); await refresh(); setNotice('Operador criado. A senha inicial será mostrada somente nesta sessão.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível criar o operador.'); }
    finally { setBusy(false); }
  }

  async function changeStores(userId: string) {
    const storeIds = assignments[userId] ?? [];
    if (!storeIds.length) { setError('Um operador ativo precisa de acesso a pelo menos uma loja.'); return; }
    setBusyUser(userId); setError(''); setNotice('');
    try { await api('/users/access', { userId, storeIds }); await refresh(); setNotice('Lojas permitidas atualizadas. A alteração vale na próxima requisição do operador.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar as lojas.'); }
    finally { setBusyUser(''); }
  }

  async function deactivate(user: Operator) {
    if (!window.confirm(`Desativar ${user.name}? As sessões atuais serão revogadas e o acesso às lojas será removido.`)) return;
    setBusyUser(user.userId); setError(''); setNotice('');
    try { await api('/users/deactivate', { userId: user.userId }); await refresh(); setNotice('Operador desativado e sessões revogadas.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível desativar o operador.'); }
    finally { setBusyUser(''); }
  }

  return <section className="user-management" aria-label="Gestão de operadores">
    <div className="section-intro"><p className="eyebrow">ACESSO DA REDE</p><h2>Operadores</h2><p>Crie contas e limite cada operador às lojas necessárias. Senhas não são enviadas por e-mail.</p></div>
    {error && <p role="alert" className="form-error">{error}</p>}{notice && <p role="status">{notice}</p>}
    {initialCredential && <aside className="initial-credential" aria-label="Senha inicial do operador"><h3>Senha inicial · exibir uma vez</h3><p>Entregue diretamente a <strong>{initialCredential.user.name}</strong>. No primeiro login, a troca de senha será obrigatória. Não atualize nem recarregue esta página antes de compartilhar, pois não será possível consultar a senha novamente.</p><code>{initialCredential.initialPassword}</code><button className="secondary" type="button" onClick={() => setInitialCredential(null)}>Ocultar senha</button></aside>}

    <form className="user-create-form" onSubmit={create}>
      <h3>Novo operador</h3><label htmlFor="operator-name">Nome</label><input id="operator-name" name="name" minLength={2} maxLength={100} required/>
      <label htmlFor="operator-email">E-mail de acesso</label><input id="operator-email" name="email" type="email" maxLength={254} autoComplete="off" required/>
      <fieldset><legend>Lojas permitidas</legend><div className="access-checks">{stores.map(store => <label key={store.id}><input type="checkbox" name="new-store" value={store.id}/><span>{store.name}</span></label>)}</div></fieldset>
      <button className="primary" type="submit" disabled={busy}>{busy ? 'Criando…' : 'Criar operador'}</button>
    </form>

    <div className="operator-list"><h3>Contas da rede</h3>{data.users.length === 0 && <p className="empty">Nenhum operador cadastrado nesta rede.</p>}
      {data.users.map(user => <article className="operator-card" key={user.userId}>
        <div className="operator-heading"><div><h4>{user.name}</h4><p>{user.email}</p></div><span className={user.active ? 'status good' : 'status out'}>{user.active ? 'Ativo' : 'Desativado'}</span></div>
        <p>Lojas: {storeNames(user.storeIds)}</p>{user.passwordSetupRequired && user.active && <p>Troca da senha inicial pendente.</p>}
        {user.active && <><fieldset><legend>Permitir acesso a</legend><div className="access-checks">{stores.map(store => <label key={store.id}><input type="checkbox" checked={(assignments[user.userId] ?? []).includes(store.id)} onChange={event => setAssignments(current => ({ ...current, [user.userId]: event.target.checked ? [...(current[user.userId] ?? []), store.id] : (current[user.userId] ?? []).filter(id => id !== store.id) }))}/><span>{store.name}</span></label>)}</div></fieldset>
          <div className="operator-actions"><button className="secondary" type="button" disabled={busyUser === user.userId} onClick={() => void changeStores(user.userId)}>Salvar lojas</button><button className="secondary" type="button" disabled={busyUser === user.userId} onClick={() => void deactivate(user)}>Desativar</button></div></>}
      </article>)}
    </div>

    <section className="access-history"><div className="section-intro"><h3>Histórico de acessos</h3><p>Criação, troca de lojas e desativação, com administrador e horário.</p></div>
      {data.history.length === 0 && <p className="empty">Nenhuma alteração de acesso.</p>}
      {data.history.map(item => <article className="history-item" key={item.id}><h4>{item.target_name} · {item.target_email}</h4><p>{item.action === 'operator_created' ? 'Operador criado' : item.action === 'stores_changed' ? 'Lojas permitidas alteradas' : 'Operador desativado'}</p><p>{accessText(item.beforeState)} → {accessText(item.afterState)}</p><p>Responsável: {item.actor}</p><time dateTime={item.at}>{new Date(item.at).toLocaleString('pt-BR')}</time></article>)}
    </section>
  </section>;
}
