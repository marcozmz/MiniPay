export const offlineMessage = 'Sem conexão. As operações estão indisponíveis e nenhuma alteração será enfileirada. Reconecte-se e confira o saldo e o histórico antes de tentar novamente.';

export type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function installationHelp(userAgent: string, touchPoints: number, secure: boolean): string {
  if (!secure) return 'A instalação exige HTTPS com certificado válido. Abra o endereço seguro fornecido pelo responsável pelo sistema.';
  if (/iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1))
    return 'No iPhone ou iPad, abra no Safari. Toque em Compartilhar e em Adicionar à Tela de Início. Se aparecer, ative Abrir como App da Web e confirme em Adicionar.';
  if (/Android/.test(userAgent))
    return 'No Chrome ou Edge do Android, abra o menu do navegador e procure Instalar aplicativo ou Adicionar à tela inicial. Se a opção não aparecer, continue usando pelo navegador.';
  if (/Macintosh/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome|Chromium|Edg/.test(userAgent))
    return 'No Safari do Mac, procure Arquivo → Adicionar ao Dock. Se essa opção não estiver disponível, continue usando pelo navegador.';
  return 'No Chrome ou Edge, procure o ícone de instalação na barra de endereço ou a opção de instalar no menu. A disponibilidade depende do navegador; se não aparecer, continue usando pelo navegador.';
}

export async function registerPwa(onUpdate: () => void) {
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
  if (registration.waiting) onUpdate();
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) onUpdate();
    });
  });
  // Deliberately no skipWaiting, clients.claim or controllerchange/reload.
  // Existing tabs/forms remain untouched; a waiting worker activates after closing them.
}
