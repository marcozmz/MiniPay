import { useEffect, useRef, useState } from "react";
import { operationLabels, type Product, type StockOperation } from "./domain/inventory";
type Props = {
  product: Product;
  onClose: () => void;
  onSave: (product: Product, operation: StockOperation, quantity: number, reason: string, id:string) => Promise<void>;
};
export function AdjustmentDialog({ product, onClose, onSave }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy,setBusy]=useState(false);
  const [operation, setOperation] = useState<StockOperation>('replenishment');
  const pending=useRef<{body:string;id:string}|null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog ref={ref} aria-labelledby="edit-title" onCancel={e=>{if(busy)e.preventDefault();else onClose();}}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const body=JSON.stringify([operation,data.get('quantity'),data.get('reason')]);
          if(pending.current?.body!==body)pending.current={body,id:crypto.randomUUID()};
          setBusy(true);setError('');
          try {
            await onSave(
              product,
              operation,
              Number(data.get("quantity")),
              String(data.get("reason") ?? "").trim(),
              pending.current!.id,
            );
            onClose();
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Não foi possível salvar.",
            );
          }finally{setBusy(false);}
        }}
      >
        <div className="dialog-heading">
          <h2 id="edit-title">Ajustar estoque</h2>
          <button
            className="icon-button"
            type="button"
            aria-label="Fechar"
            disabled={busy} onClick={onClose}
          >
            ×
          </button>
        </div>
        <p>{product.name}</p>
        <p className="dialog-note">
          Saldo ao abrir: {product.stock} unidades. A operação será salva nesta loja, com seu usuário, data e saldos anterior e novo. A observação é opcional. Se o saldo mudar, atualize a lista e abra o produto novamente.
        </p>
        <fieldset disabled={busy}>
        <label htmlFor="operation">Operação</label>
        <select id="operation" name="operation" value={operation} onChange={e=>setOperation(e.target.value as StockOperation)}>
          {Object.entries(operationLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
        </select>
        <p className="dialog-note">{operation==='count'?'Informe o total encontrado. Ele será o saldo final.':operation==='loss'?'Informe quantas unidades retirar do saldo atual.':'Informe quantas unidades adicionar ao saldo atual.'}</p>
        <label htmlFor="quantity">{operation==='count'?'Quantidade encontrada':operation==='loss'?'Quantidade perdida':'Quantidade recebida'}</label>
        <input
          key={operation}
          autoFocus
          id="quantity"
          name="quantity"
          type="number"
          required
          min={operation==='count'?0:1}
          max="999999"
          step="1"
          defaultValue={operation==='count'?product.stock:''}
        />
        <label htmlFor="reason">Observação (opcional)</label>
        <input
          id="reason"
          name="reason"
          maxLength={200}
          placeholder="Ex.: conferência da prateleira"
        />
        </fieldset><p className="form-error" role="alert">
          {error}
        </p>
        <div className="dialog-actions">
          <button className="secondary" type="button" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button className="primary" disabled={busy}>{busy?"Salvando…":"Salvar ajuste"}</button>
        </div>
      </form>
    </dialog>
  );
}
