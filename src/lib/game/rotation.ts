/** Ciclo de tienda: 3 días en ms. */
export const SHOP_ROTATION_MS = 3 * 24 * 60 * 60 * 1000;

export function currentRotationSlot(now = Date.now()): number {
  return Math.floor(now / SHOP_ROTATION_MS);
}

export function nextShopRotationAt(now = Date.now()): number {
  return (currentRotationSlot(now) + 1) * SHOP_ROTATION_MS;
}
