/** Keep sale-price rounding consistent with the backend /products/prices endpoint. */
export function calculateSalePrice(basePrice: unknown, salePercent: unknown): number {
  const price = Number(basePrice);
  const safePrice = Number.isFinite(price) ? Math.max(0, price) : 0;
  const discount = Number(salePercent);
  const safeDiscount = Number.isFinite(discount)
    ? Math.max(0, Math.min(100, discount))
    : 0;

  return Math.round(safePrice * (1 - safeDiscount / 100));
}
