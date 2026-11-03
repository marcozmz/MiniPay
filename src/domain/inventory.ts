export type Product = {
  id: number;
  name: string;
  code: string;
  category: 'Bebidas'|'Mercearia'|'Doces'|'Higiene';
  productVersion:number;
  price: number;
  stock: number;
  minimum: number;
  storeId: string;
  version: number;
  photoUrl?: string | null;
};
export type StockOperation = 'replenishment' | 'loss' | 'count';
export const operationLabels: Record<StockOperation, string> = {
  replenishment: 'Reposição', loss: 'Perda', count: 'Contagem',
};
export type MovementOperation = StockOperation | 'initial';
export const movementLabels: Record<MovementOperation, string> = { ...operationLabels, initial: 'Estoque inicial' };
export function calculateStock(before: number, operation: StockOperation, quantity: number): number {
  if (!Number.isSafeInteger(before) || before < 0 || before > 999999)
    throw new Error('Saldo atual inválido.');
  if (!['replenishment', 'loss', 'count'].includes(operation) ||
      !Number.isSafeInteger(quantity) || quantity < (operation === 'count' ? 0 : 1) || quantity > 999999)
    throw new Error('Informe uma quantidade inteira válida.');
  const after = operation === 'count' ? quantity : before + (operation === 'loss' ? -quantity : quantity);
  if (after < 0) throw new Error('Saldo insuficiente para registrar a perda.');
  if (after > 999999) throw new Error('O saldo não pode ultrapassar 999999 unidades.');
  return after;
}
export type Adjustment = {
  product: Product;
  operation: StockOperation;
  quantity: number;
  expectedVersion: number;
  reason?: string;
  id: string;
  at: string;
};
export type Movement = {
  actor?:string;
  id: string;
  at: string;
  storeId: string;
  name: string;
  before: number;
  after: number;
  operation: MovementOperation;
  delta: number;
  reason: string;
};
export type ListingChange = {id:string;at:string;storeId:string;productId:number;beforeValues:Record<string,unknown>;afterValues:Record<string,unknown>;reason:string;actor:string};
export type State = { products: Product[]; history: Movement[]; listingHistory:ListingChange[] };
export function adjust(state: State, change: Adjustment): State {
  const previous = state.products.find(
    (p) => p.id === change.product.id && p.storeId === change.product.storeId,
  );
  if (!previous) throw new Error("Produto não encontrado nesta loja.");
  if (state.history.some((h) => h.id === change.id))
    throw new Error("Ajuste já registrado.");
  if (previous.version !== change.expectedVersion)
    throw new Error("O saldo mudou. Abra o produto novamente antes de salvar.");
  const after = calculateStock(previous.stock, change.operation, change.quantity);
  return {
    products: state.products.map((p) =>
      p === previous ? { ...p, stock: after, version: p.version + 1 } : p,
    ),
    history: [
      {
        id: change.id,
        at: change.at,
        storeId: previous.storeId,
        name: previous.name,
        before: previous.stock,
        after,
        operation: change.operation,
        delta: after - previous.stock,
        reason: change.reason?.trim() ?? "",
      },
      ...state.history,
    ],
    listingHistory: state.listingHistory,
  };
}
