/** Calculate a discounted unit price in whole VND, consistently across API paths. */
/** Number, numeric string, or Prisma Decimal (coerced via Number()). */
export type NumericLike = number | string | { toString(): string };

export function calculateDiscountedUnitPrice(price: NumericLike, discountPercent: NumericLike = 0): number {
    const normalizedPrice = Number(price);
    const normalizedDiscount = Number(discountPercent);
    if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) return 0;
    if (!Number.isFinite(normalizedDiscount)) return Math.round(normalizedPrice);
    const discount = Math.min(100, Math.max(0, normalizedDiscount));
    return Math.max(0, Math.round(normalizedPrice * (1 - discount / 100)));
}

/** Round currency values to whole VND and guard against NaN/Infinity. */
export function toVnd(value: NumericLike): number {
    const amount = Number(value);
    return Number.isFinite(amount) ? Math.round(amount) : 0;
}
