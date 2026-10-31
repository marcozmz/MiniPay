import { useEffect, useRef, useState } from 'react';
import type { Product } from './domain/inventory';

type Props = { product: Product; storeName: string; onClose: () => void; onSave: (input: Record<string, unknown>) => Promise<void> };
const categories = ['Bebidas', 'Mercearia', 'Doces', 'Higiene'] as const;

export function CatalogDialog({ product, storeName, onClose, onSave }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const pending = useRef<{ body: string; id: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return <dialog ref={ref} aria-labelledby="catalog-edit-title" onCancel={event => { if (busy) event.preventDefault(); else onClose(); }}>
    <form onSubmit={async event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const priceText = String(data.get('price')).trim();
      if (!/^\d{1,6}([,.]\d{1,2})?$/.test(priceText)) { setError('Use um preço como 12,90, com até duas casas decimais.'); return; }
      const [whole, fraction = ''] = priceText.replace(',', '.').split('.');
      const body = {
        productId: product.id,
        storeId: product.storeId,
        expectedListingVersion: product.version,
        expectedProductVersion: product.productVersion,
        name: String(data.get('name')).trim(),
        code: String(data.get('code')).trim(),
        category: String(data.get('category')),
        price: Number(whole) * 100 + Number(fraction.padEnd(2, '0')),
        minimum: Number(data.get('minimum')),
        reason: String(data.get('reason')).trim(),
      };
      const requestBody = JSON.stringify(body);
      if (pending.current?.body !== requestBody) pending.current = { body: requestBody, id: crypto.randomUUID() };
      setBusy(true); setError('');
      try { await onSave({ ...body, id: pending.current.id }); onClose(); }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar. Atualize os dados e tente novamente.'); }
      finally { setBusy(false); }
    }}>
      <div className="dialog-heading"><div><p className="eyebrow">CATÁLOGO DA LOJA</p><h2 id="catalog-edit-title">Editar produto</h2></div><button type="button" className="icon-button" aria-label="Fechar edição" disabled={busy} onClick={onClose}>×</button></div>
      <p className="dialog-note">Preço e estoque mínimo valem somente para {storeName}. Nome, código e categoria são compartilhados pela rede.</p>
      <fieldset disabled={busy}>
        <label htmlFor="edit-product-name">Nome do produto</label><input autoFocus id="edit-product-name" name="name" required minLength={2} maxLength={100} defaultValue={product.name}/>
        <label htmlFor="edit-product-code">Código de barras</label><input id="edit-product-code" name="code" inputMode="numeric" pattern="[0-9]{8,14}" minLength={8} maxLength={14} required defaultValue={product.code}/>
        <label htmlFor="edit-product-category">Categoria</label><select id="edit-product-category" name="category" defaultValue={product.category}>{categories.map(category => <option key={category}>{category}</option>)}</select>
        <div className="form-grid"><div><label htmlFor="edit-product-price">Preço de venda (R$)</label><input id="edit-product-price" name="price" inputMode="decimal" pattern="\d{1,6}([,.]\d{1,2})?" required defaultValue={(product.price / 100).toFixed(2).replace('.', ',')}/></div><div><label htmlFor="edit-product-minimum">Estoque mínimo</label><input id="edit-product-minimum" name="minimum" type="number" min="0" max="999999" step="1" required defaultValue={product.minimum}/></div></div>
        <label htmlFor="edit-product-reason">Motivo da alteração</label><input id="edit-product-reason" name="reason" maxLength={200} required placeholder="Ex.: atualização de preço ou contagem"/>
      </fieldset>
      <p role="alert" className="form-error">{error}</p>
      <div className="dialog-actions"><button type="button" className="secondary" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar produto'}</button></div>
    </form>
  </dialog>;
}
