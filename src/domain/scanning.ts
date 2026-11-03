import type { Product } from './inventory';

// Codes are identifiers, never numbers. Both checkout and inventory use products.code.
export const productCodePattern = /^\d{8,14}$/;
export const maxPhotoBytes = 3 * 1024 * 1024;
export type PhotoInput = { mime: 'image/jpeg' | 'image/png' | 'image/webp'; data: string };
export type CatalogProduct = Pick<Product, 'id' | 'name' | 'code' | 'category' | 'productVersion' | 'photoUrl'>;
export type CodeLookup = { kind: 'active'; product: Product } | { kind: 'catalog'; product: CatalogProduct } | { kind: 'unknown'; code: string };

// A synchronous latch protects against callbacks arriving before React renders.
export function createReadGate() {
  let armed = false;
  return {
    arm() { armed = true; },
    pause() { armed = false; },
    take(code: string) {
      if (!armed || !productCodePattern.test(code)) return false;
      armed = false;
      return true;
    },
  };
}
