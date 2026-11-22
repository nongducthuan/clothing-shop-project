import { describe, expect, it } from 'vitest';
import { calculateMembershipDiscount, getDiscountableSubtotal } from './checkoutPricing';

describe('checkoutPricing', () => {
  it('excludes Buy X products from membership discounts when their promotion is non-stackable', () => {
    const items = [
      { id: 25, price: 200_000, quantity: 2 },
      { id: 40, price: 150_000, quantity: 1 },
    ];
    const blockedProductIds = new Set([25]);

    expect(getDiscountableSubtotal(items, blockedProductIds)).toBe(150_000);
    expect(calculateMembershipDiscount(items, 20, blockedProductIds)).toBe(30_000);
  });
});
