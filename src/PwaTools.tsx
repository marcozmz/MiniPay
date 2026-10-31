import { useEffect, useState } from 'react';
import { installationHelp, offlineMessage, registerPwa, type InstallPrompt } from './pwa';

export function PwaTools({ authenticated }: { authenticated: boolean }) {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [update, setUpdate] = useState(false);
  useEffect(() => {
    const connectivity = () => setOnline(navigator.onLine);
    const offer = (event: Event) => { event.preventDefault(); if (window.isSecureContext) setPrompt(event as InstallPrompt); };
    const done = () => { setInstalled(true); setPrompt(null); };
    const display = window.matchMedia('(display-mode: standalone)');
    const displayChanged = () => setInstalled(display.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    window.addEventListener('online', connectivity); window.addEventListener('offline', connectivity);
    window.addEventListener('beforeinstallprompt', offer); window.addEventListener('appinstalled', done);
    display.addEventListener('change', displayChanged);
    if (import.meta.env.PROD && window.isSecureContext && 'serviceWorker' in navigator)
      void registerPwa(() => setUpdate(true)).catch(() => setNotice('Não foi possível preparar a página de indisponibilidade offline. Confira a conexão e abra o aplicativo novamente depois.'));
    return () => {
      window.removeEventListener('online', connectivity); window.removeEventListener('offline', connectivity);
      window.removeEventListener('beforeinstallprompt', offer); window.removeEventListener('appinstalled', done);
      display.removeEventListener('change', displayChanged);
    };
  }, []);
  if (installed && online && !update && !notice) return null;
  return <aside className={'app-support' + (authenticated ? ' with-sidebar' : '')} aria-label="Instalação e conexão">
    {!online && <p className="connection-warning" role="alert">{offlineMessage}</p>}
    {!installed && (prompt ? <button className="secondary" type="button" disabled={busy || !online} onClick={async () => {
      setBusy(true); setNotice(''); setPrompt(null);
      try { await prompt.prompt(); await prompt.userChoice; }
      catch { setNotice('A instalação não foi concluída. Consulte as instruções do navegador.'); }
      finally { setBusy(false); }
    }}>{busy ? 'Abrindo instalação…' : 'Instalar aplicativo'}</button> :
      <details className="install-help"><summary>Como instalar o aplicativo</summary><p>{installationHelp(navigator.userAgent, navigator.maxTouchPoints, window.isSecureContext)}</p></details>)}
    {notice && <p role="status">{notice}</p>}
    {update && <p role="status">Atualização disponível. Termine suas operações e feche todas as abas e janelas deste aplicativo; depois abra novamente. Seus formulários não serão recarregados automaticamente.</p>}
  </aside>;
}
