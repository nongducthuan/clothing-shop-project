import { describe, expect, it } from 'vitest';
import { calculateSalePrice } from './priceUtils';

describe('calculateSalePrice', () => {
  it('returns the base price when there is no discount', () => {
    expect(calculateSalePrice(120_001, 0)).toBe(120_001);
  });

  it('rounds the discounted unit price to the same whole VND value as the backend', () => {
    // 120001 * (1 - 12.5%) = 105000.875, rounded to 105001.
    expect(calculateSalePrice(120_001, 12.5)).toBe(105_001);
  });

  it('clamps invalid or out-of-range discounts safely', () => {
    expect(calculateSalePrice(100_000, 150)).toBe(0);
    expect(calculateSalePrice(100_000, -10)).toBe(100_000);
    expect(calculateSalePrice(100_000, Number.NaN)).toBe(100_000);
    expect(calculateSalePrice(Number.NaN, 10)).toBe(0);
  });
});
