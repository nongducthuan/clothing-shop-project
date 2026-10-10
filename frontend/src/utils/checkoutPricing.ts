export type CheckoutPricingItem = {
  id: number | string;
  price: number | string;
  quantity?: number;
};

export function getDiscountableSubtotal(
  items: CheckoutPricingItem[],
  blockedProductIds: ReadonlySet<number>
): number {
  return items.reduce((sum, item) =>
    blockedProductIds.has(Number(item.id))
      ? sum
      : sum + Number(item.price) * (item.quantity ?? 1),
  0);
}

export function calculateMembershipDiscount(
  items: CheckoutPricingItem[],
  discountPercent: number,
  blockedProductIds: ReadonlySet<number>
): number {
  return getDiscountableSubtotal(items, blockedProductIds) * (Number(discountPercent) / 100);
}
