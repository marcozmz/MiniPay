import { useEffect, useRef, useState } from 'react';
import { api } from './api';
import { ProductPhoto } from './ProductPhoto';
import { readPhotoFile } from './photo';
import type { CatalogProduct, PhotoInput } from './domain/scanning';

export function CreateDialog({ kind, storeId, onClose, onCreated, scan }: { kind: 'store' | 'product'; storeId: string; onClose: () => void; onCreated: () => Promise<void>; scan?: { code: string; catalog?: CatalogProduct } }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pending = useRef<{ body: string; id: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState<PhotoInput | null>(null);
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const catalog = scan?.catalog;
  const selectPhoto = async (file?: File) => {
    if (!file) return;
    setPhoto(null); setPhotoError(''); setReadingPhoto(true);
    try { setPhoto(await readPhotoFile(file)); }
    catch (error) { setPhotoError((error as Error).message); }
    finally { setReadingPhoto(false); }
  };
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
          if (scan && !catalog && !photo) throw Error('Tire ou escolha uma foto do novo produto.');
          const body = { storeId, name: catalog?.name ?? name, code: scan?.code ?? String(data.get('code')), category: catalog?.category ?? String(data.get('category')), price: Number(whole) * 100 + Number(fraction.padEnd(2, '0')), initialStock: Number(data.get('initialStock')), minimum: Number(data.get('minimum')), reason: String(data.get('reason') ?? '').trim(), ...(photo ? { photo } : {}) };
          const serialized = JSON.stringify(body);
          if (pending.current?.body !== serialized) pending.current = { body: serialized, id: crypto.randomUUID() };
          // One request: catalog, listing and opening movement commit together.
          await api(scan ? '/products/from-scan' : '/products', { id: pending.current!.id, ...body });
        }
        await onCreated(); onClose();
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível cadastrar.'); }
      finally { setBusy(false); }
    }}>
      <h2 id="create-title">{kind === 'store' ? 'Nova loja' : catalog ? 'Adicionar à loja' : 'Novo produto'}</h2>
      <p className="dialog-note">{kind === 'store' ? 'A loja será criada na sua rede e no franqueado inicial.' : 'O estoque inicial vale somente para a loja selecionada e será registrado no histórico.'}</p>
      <fieldset disabled={busy || readingPhoto}>
        <label htmlFor="new-name">Nome</label><input autoFocus id="new-name" name="name" required readOnly={!!catalog} defaultValue={catalog?.name} minLength={2} maxLength={kind === 'store' ? 80 : 100}/>
        {kind === 'product' && <>
          <label htmlFor="new-code">Código de barras</label><input id="new-code" name="code" required readOnly={!!scan} defaultValue={scan?.code} inputMode="numeric" pattern="[0-9]{8,14}" minLength={8} maxLength={14}/>
          <label htmlFor="new-category">Categoria</label><select id="new-category" name="category" disabled={!!catalog} defaultValue={catalog?.category ?? 'Mercearia'}><option>Bebidas</option><option>Mercearia</option><option>Doces</option><option>Higiene</option></select>
          {catalog && <ProductPhoto key={catalog.photoUrl} url={catalog.photoUrl} name={catalog.name}/>}
          {scan && !catalog && <>
            <p>Foto obrigatória · JPEG, PNG ou WebP · até 20 MiB e 16 megapixels. A imagem será reduzida para envio.</p>
            <label htmlFor="take-photo">Tirar foto</label><input id="take-photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e => { void selectPhoto(e.target.files?.[0]); e.target.value = ''; }}/>
            <label htmlFor="choose-photo">Escolher foto</label><input id="choose-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { void selectPhoto(e.target.files?.[0]); e.target.value = ''; }}/>
            {photo && <img className="product-photo" src={`data:${photo.mime};base64,${photo.data}`} alt="Prévia do novo produto"/>}
          </>}
          <div className="form-grid">
            <div><label htmlFor="new-price">Preço (R$)</label><input id="new-price" name="price" inputMode="decimal" required placeholder="0,00" pattern="\d{1,6}([,.]\d{1,2})?"/></div>
            <div><label htmlFor="new-initial-stock">Estoque inicial</label><input id="new-initial-stock" name="initialStock" type="number" required min="0" max="999999" step="1" defaultValue={0}/></div>
            <div><label htmlFor="new-minimum">Estoque mínimo</label><input id="new-minimum" name="minimum" type="number" required min="0" max="999999" step="1" defaultValue={0}/></div>
          </div>
          <label htmlFor="new-reason">Observação (opcional)</label><input id="new-reason" name="reason" maxLength={200} placeholder="Ex.: inclusão no catálogo"/>
        </>}
      </fieldset>
      <p role="status">{readingPhoto ? 'Abrindo foto…' : ''}</p><p role="alert" className="form-error">{photoError}</p>
      <p role="alert" className="form-error">{error}</p>
      <div className="dialog-actions"><button type="button" className="secondary" disabled={busy || readingPhoto} onClick={onClose}>Cancelar</button><button className="primary" disabled={busy || readingPhoto || (!!scan && !catalog && !photo)}>{busy ? 'Salvando…' : catalog ? 'Adicionar à loja' : 'Cadastrar'}</button></div>
    </form>
  </dialog>;
}
