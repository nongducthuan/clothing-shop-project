import { calculateDiscountedUnitPrice, toVnd } from '../../utils/pricing';

describe('pricing helpers', () => {
  it('rounds discounted unit prices consistently to whole VND', () => {
    expect(calculateDiscountedUnitPrice(999, 10)).toBe(899);
    expect(calculateDiscountedUnitPrice('999', '50')).toBe(500);
  });

  it('clamps invalid ranges and handles non-finite inputs safely', () => {
    expect(calculateDiscountedUnitPrice(999, 150)).toBe(0);
    expect(calculateDiscountedUnitPrice(999, -10)).toBe(999);
    expect(calculateDiscountedUnitPrice(-10, 10)).toBe(0);
    expect(calculateDiscountedUnitPrice(999, Number.NaN)).toBe(999);
  });

  it('rounds money to whole VND without propagating NaN', () => {
    expect(toVnd(449.5)).toBe(450);
    expect(toVnd('100.4')).toBe(100);
    expect(toVnd(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
