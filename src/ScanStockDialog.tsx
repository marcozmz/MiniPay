import { useEffect, useRef, useState } from 'react';
import { api } from './api';
import { startCamera, cameraError } from './camera';
import { CreateDialog } from './CreateDialog';
import { ProductPhoto } from './ProductPhoto';
import type { Product } from './domain/inventory';
import { productCodePattern, type CodeLookup } from './domain/scanning';

function CountForm({ product, onBusy, onSaved }: { product: Product; onBusy: (busy: boolean) => void; onSaved: () => Promise<void> }) {
  const [quantity, setQuantity] = useState(String(product.stock));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef<{ body: string; id: string } | null>(null);
  const submitting = useRef(false);
  return <form onSubmit={async event => {
    event.preventDefault();
    if (submitting.current || saved) return;
    submitting.current = true;
    const reason = String(new FormData(event.currentTarget).get('reason') ?? '').trim();
    const body = { storeId: product.storeId, productId: product.id, expectedVersion: product.version, operation: 'count', quantity: Number(quantity), reason };
    const serialized = JSON.stringify(body);
    if (pending.current?.body !== serialized) pending.current = { body: serialized, id: crypto.randomUUID() };
    setBusy(true); onBusy(true); setError('');
    try { await api('/adjustments', { id: pending.current.id, ...body }); setSaved(true); await onSaved(); }
    catch (error) { setError((error as Error).message); }
    finally { submitting.current = false; setBusy(false); onBusy(false); }
  }}>
    <ProductPhoto key={product.photoUrl} url={product.photoUrl} name={product.name}/>
    <h3>{product.name}</h3><p>Código: {product.code}</p><p>Saldo consultado: <strong>{product.stock} un.</strong></p>
    <fieldset disabled={busy || saved}>
      <label htmlFor="count-quantity">Quantidade contada</label>
      <div className="count-quantity">
        <button type="button" className="secondary" aria-label="Diminuir quantidade" disabled={Number(quantity) <= 0} onClick={() => setQuantity(String(Math.max(0, Number(quantity || 0) - 1)))}>−</button>
        <input id="count-quantity" name="quantity" type="number" inputMode="numeric" min="0" max="999999" step="1" required value={quantity} onChange={e => setQuantity(e.target.value)}/>
        <button type="button" className="secondary" aria-label="Aumentar quantidade" disabled={Number(quantity) >= 999999} onClick={() => setQuantity(String(Math.min(999999, Number(quantity || 0) + 1)))}>+</button>
      </div>
      <p className="dialog-note">Informe o total encontrado, inclusive zero. A contagem será registrada com seu usuário, data e saldos anterior e novo.</p>
      <label htmlFor="count-reason">Observação (opcional)</label><input id="count-reason" name="reason" maxLength={200}/>
      <button className="primary">{busy ? 'Salvando…' : 'Confirmar contagem'}</button>
    </fieldset>
    <p role="status">{saved ? 'Contagem registrada. Scanner pausado.' : ''}</p><p role="alert" className="form-error">{error}</p>
  </form>;
}

export function ScanStockDialog({ storeId, storeName, role, onClose, onChanged }: { storeId: string; storeName: string; role: 'admin' | 'operator'; onClose: () => void; onChanged: () => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const camera = useRef<ReturnType<typeof startCamera> | null>(null);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const [code, setCode] = useState('');
  const [lookup, setLookup] = useState<CodeLookup | null>(null);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const pause = () => { camera.current?.stop(); camera.current = null; setCameraActive(false); };
  useEffect(() => {
    mounted.current = true;
    const stop = () => { camera.current?.stop(); camera.current = null; setCameraActive(false); };
    const leave = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', leave);
    window.addEventListener('pagehide', stop);
    return () => { mounted.current = false; camera.current?.stop(); document.removeEventListener('visibilitychange', leave); window.removeEventListener('pagehide', stop); };
  }, []);
  useEffect(() => {
    if (creating) return;
    const element = dialog.current!; element.showModal();
    return () => element.close();
  }, [creating]);
  async function find(value: string, offerCreate = true) {
    if (inFlight.current) return;
    pause(); setCode(value); setError(''); setLookup(null); setConfirmed(false);
    if (!productCodePattern.test(value)) { setError('Informe de 8 a 14 dígitos, preservando os zeros à esquerda.'); return; }
    inFlight.current = true; setBusy(true);
    try {
      const result = await api<CodeLookup>(`/products/lookup?storeId=${encodeURIComponent(storeId)}&code=${encodeURIComponent(value)}`);
      if (mounted.current) { setLookup(result); if (offerCreate && result.kind === 'unknown' && role === 'admin') setCreating(true); }
    } catch (error) { if (mounted.current) setError((error as Error).message); }
    finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  function readAnother() {
    pause(); setLookup(null); setConfirmed(false); setCode(''); setError(''); setCameraActive(true);
    const session = startCamera(video.current!, value => { if (mounted.current) void find(value); });
    camera.current = session;
    void session.ready.catch(error => { if (mounted.current && camera.current === session) { pause(); setError(cameraError(error)); } });
  }
  if (creating && lookup && lookup.kind !== 'active') return <CreateDialog kind="product" storeId={storeId} scan={{ code, ...(lookup.kind === 'catalog' ? { catalog: lookup.product } : {}) }} onClose={() => setCreating(false)} onCreated={async () => { await onChanged(); await find(code, false); }}/ >;
  return <dialog ref={dialog} aria-labelledby="scan-title" onCancel={event => { if (busy) event.preventDefault(); else onClose(); }}>
    <div className="dialog-heading"><h2 id="scan-title">Contar estoque pela câmera</h2><button type="button" className="icon-button" aria-label="Fechar" disabled={busy} onClick={onClose}>×</button></div>
    <p>Loja: <strong>{storeName}</strong></p>
    <video ref={video} className="scanner-video" hidden={!cameraActive} muted playsInline autoPlay aria-label="Câmera para ler código de barras"/>
    <p role="status">{busy ? 'Consultando…' : cameraActive ? 'Aponte para o código de barras.' : 'Scanner pausado. Você também pode digitar o código.'}</p>
    <div className="dialog-actions"><button type="button" className="secondary" disabled={busy} onClick={readAnother}>{lookup || code ? 'Ler outro produto' : 'Abrir câmera'}</button>{cameraActive && <button type="button" className="secondary" onClick={pause}>Pausar câmera</button>}</div>
    {!lookup && <form onSubmit={event => { event.preventDefault(); void find(code); }}>
      <label htmlFor="manual-code">Digitar código</label><input id="manual-code" type="text" inputMode="numeric" pattern="[0-9]{8,14}" minLength={8} maxLength={14} required value={code} disabled={busy} onChange={e => setCode(e.target.value)}/>
      <button className="primary" disabled={busy}>Buscar código</button>
    </form>}
    <p role="alert" className="form-error">{error}</p>
    {lookup?.kind === 'active' && <>
      <CountForm key={`${lookup.product.id}:${lookup.product.version}`} product={lookup.product} onBusy={setBusy} onSaved={async () => { setConfirmed(true); await onChanged(); }}/>
      {!confirmed && <button type="button" className="secondary" disabled={busy} onClick={() => { void find(code, false); }}>Consultar saldo novamente</button>}
    </>}
    {lookup?.kind === 'catalog' && <><ProductPhoto key={lookup.product.photoUrl} url={lookup.product.photoUrl} name={lookup.product.name}/><h3>{lookup.product.name}</h3><p>Produto do catálogo da rede, ausente nesta loja.</p>{role === 'admin' ? <button className="primary" onClick={() => setCreating(true)}>Adicionar à loja</button> : <p>Peça ao administrador para adicionar o produto à loja.</p>}</>}
    {lookup?.kind === 'unknown' && <><p>Código {lookup.code} desconhecido nesta rede.</p>{role === 'admin' ? <button className="primary" onClick={() => setCreating(true)}>Novo produto</button> : <p>Peça ao administrador para cadastrar o novo produto com foto.</p>}</>}
    <div className="dialog-actions"><button type="button" className="secondary" disabled={busy} onClick={onClose}>Fechar</button></div>
  </dialog>;
}
