import { useState } from 'react';
import { api } from './api';

export function FirstAccess({ onComplete }: { onComplete: () => Promise<void> }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return <main className="login-page"><section className="login-card" aria-labelledby="first-access-title">
    <div className="brand"><span className="brand-icon">m.</span>minimercado</div>
    <p className="eyebrow">PRIMEIRO ACESSO</p><h1 id="first-access-title">Defina sua senha<span>.</span></h1>
    <p className="subtitle">A senha inicial é temporária. Troque-a para continuar.</p>
    <form onSubmit={async event => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      const currentPassword = String(data.get('currentPassword')); const newPassword = String(data.get('newPassword')); const confirmation = String(data.get('confirmation'));
      setError(''); if (newPassword !== confirmation) { setError('A confirmação não confere.'); return; }
      setBusy(true); try { await api('/account/change-password', { currentPassword, newPassword }); await onComplete(); }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível trocar a senha.'); }
      finally { setBusy(false); }
    }}>
      <label htmlFor="initial-password">Senha inicial</label><input id="initial-password" name="currentPassword" type="password" autoComplete="current-password" required/>
      <label htmlFor="new-password">Nova senha</label><input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required/>
      <label htmlFor="confirm-password">Confirme a nova senha</label><input id="confirm-password" name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required/>
      <p className="form-error" role="alert">{error}</p><button className="primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar nova senha'}</button>
    </form>
  </section></main>;
}
