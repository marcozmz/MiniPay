import { useEffect, useRef, useState } from 'react';
import { api } from './api';

export function CreateDialog({ kind, storeId, onClose, onCreated }: { kind: 'store' | 'product'; storeId: string; onClose: () => void; onCreated: () => Promise<void> }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pending = useRef<{ body: string; id: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} aria-labelledby="create-title" onCancel={event => { if (busy) event.preventDefault(); else onClose(); }}>
    <form onSubmit={async event => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      setError(''); setBusy(true);
      try {
        const name = String(data.get('name')).trim();
        if (kind === 'store') {
          if (name.includes('\uFFFD')) throw new Error('O nome contém caracteres corrompidos. Digite novamente.');
          await api('/stores', { name });
        } else {
          const text = String(data.get('price')).trim();
          if (!/^\d{1,6}([,.]\d{1,2})?$/.test(text)) throw Error('Use um preço como 12,90.');
          const [whole, fraction = ''] = text.replace(',', '.').split('.');
          const body = { storeId, name, code: String(data.get('code')), category: String(data.get('category')), price: Number(whole) * 100 + Number(fraction.padEnd(2, '0')), initialStock: Number(data.get('initialStock')), minimum: Number(data.get('minimum')), reason: String(data.get('reason') ?? '').trim() };
          const serialized = JSON.stringify(body);
          if (pending.current?.body !== serialized) pending.current = { body: serialized, id: crypto.randomUUID() };
          // One request: catalog, listing and opening movement commit together.
          await api('/products', { id: pending.current!.id, ...body });
        }
        await onCreated(); onClose();
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível cadastrar.'); }
      finally { setBusy(false); }
    }}>
      <h2 id="create-title">{kind === 'store' ? 'Nova loja' : 'Novo produto'}</h2>
      <p className="dialog-note">{kind === 'store' ? 'A loja será criada na sua rede e no franqueado inicial.' : 'O estoque inicial vale somente para a loja selecionada e será registrado no histórico.'}</p>
      <fieldset disabled={busy}>
        <label htmlFor="new-name">Nome</label><input autoFocus id="new-name" name="name" required minLength={2} maxLength={kind === 'store' ? 80 : 100}/>
        {kind === 'product' && <>
          <label htmlFor="new-code">Código de barras</label><input id="new-code" name="code" required inputMode="numeric" pattern="[0-9]{8,14}" minLength={8} maxLength={14}/>
          <label htmlFor="new-category">Categoria</label><select id="new-category" name="category" defaultValue="Mercearia"><option>Bebidas</option><option>Mercearia</option><option>Doces</option><option>Higiene</option></select>
          <div className="form-grid">
            <div><label htmlFor="new-price">Preço (R$)</label><input id="new-price" name="price" inputMode="decimal" required placeholder="0,00" pattern="\d{1,6}([,.]\d{1,2})?"/></div>
            <div><label htmlFor="new-initial-stock">Estoque inicial</label><input id="new-initial-stock" name="initialStock" type="number" required min="0" max="999999" step="1" defaultValue={0}/></div>
            <div><label htmlFor="new-minimum">Estoque mínimo</label><input id="new-minimum" name="minimum" type="number" required min="0" max="999999" step="1" defaultValue={0}/></div>
          </div>
          <label htmlFor="new-reason">Observação (opcional)</label><input id="new-reason" name="reason" maxLength={200} placeholder="Ex.: inclusão no catálogo"/>
        </>}
      </fieldset>
      <p role="alert" className="form-error">{error}</p>
      <div className="dialog-actions"><button type="button" className="secondary" disabled={busy} onClick={onClose}>Cancelar</button><button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Cadastrar'}</button></div>
    </form>
  </dialog>;
}
