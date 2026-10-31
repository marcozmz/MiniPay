import type { Product } from './inventory';

export type ProductFilters = { query: string; criticalOnly: boolean; category: string };

export function filterProducts(products: Product[], filters: ProductFilters) {
  const query = filters.query.toLocaleLowerCase('pt-BR').trim();
  return products.filter(product =>
    (!query || product.name.toLocaleLowerCase('pt-BR').includes(query) || product.code.includes(query)) &&
    (!filters.criticalOnly || product.stock <= product.minimum) &&
    (!filters.category || product.category === filters.category),
  );
}

export function exportInventoryCsv(products: Product[], storeName: string) {
  const cell = (value: unknown) => {
    const text = String(value).replace(/"/g, '""').replace(/^([=+@-])/, '\t$1');
    return `"${text}"`;
  };
  const rows = [
    ['Produto', 'Código de barras', 'Categoria', 'Preço (R$)', 'Estoque', 'Mínimo'],
    ...products.map(product => [product.name, product.code, product.category, (product.price / 100).toFixed(2).replace('.', ','), product.stock, product.minimum]),
  ];
  const slug = storeName.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'loja';
  return { filename: `estoque-${slug}.csv`, content: `\ufeff${rows.map(row => row.map(cell).join(';')).join('\r\n')}` };
}
