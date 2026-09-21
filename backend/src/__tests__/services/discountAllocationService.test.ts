import { allocateItemDiscounts, AllocatableItem } from '../../services/discountAllocationService';

const cents = (value: number) => Math.round(value * 100);

const sumPayable = (items: { payable_amount: number }[]) =>
  items.reduce((sum, item) => sum + cents(item.payable_amount), 0);

describe('allocateItemDiscounts – Pro-rata allocation', () => {
  it('splits a 100k voucher over 300k + 200k items proportionally (60/40)', () => {
    const items: AllocatableItem[] = [
      { product_id: 1, price: 300000, quantity: 1 },
      { product_id: 2, price: 200000, quantity: 1 },
    ];

    const result = allocateItemDiscounts(items, {
      membershipDiscount: 0,
      voucherDiscount: 100000,
      eligibleProductIds: [1, 2],
      payableTotal: 400000,
    });

    expect(result[0]).toEqual({ discount_amount: 60000, payable_amount: 240000 });
    expect(result[1]).toEqual({ discount_amount: 40000, payable_amount: 160000 });
  });

  it('refunds partial quantity at the real paid unit price (not the list price)', () => {
    const result = allocateItemDiscounts(
      [
        { product_id: 1, price: 300000, quantity: 1 },
        { product_id: 2, price: 200000, quantity: 2 },
      ],
      {
        membershipDiscount: 0,
        voucherDiscount: 70000, // 10% của 700.000đ
        eligibleProductIds: [1, 2],
        payableTotal: 630000,
      }
    );

    // Item B: 400.000đ giá gốc - 40.000đ (voucher) = 360.000đ cho 2 sản phẩm → 180.000đ/sản phẩm
    expect(result[1].payable_amount).toBe(360000);
    const unitPayable = result[1].payable_amount / 2;
    expect(unitPayable).toBe(180000);     // không phải 200.000đ giá niêm yết
    expect(unitPayable * 1).toBe(180000); // hoàn 1 sản phẩm = 180.000đ
    expect(sumPayable(result)).toBe(cents(630000));
  });

  it('allocates membership discount proportionally together with the voucher', () => {
    const items: AllocatableItem[] = [
      { product_id: 1, price: 300000, quantity: 2 }, // 600k
      { product_id: 2, price: 200000, quantity: 1 }, // 200k
    ];

    const result = allocateItemDiscounts(items, {
      membershipDiscount: 80000,   // 10% của 800k
      voucherDiscount: 50000,
      eligibleProductIds: [1, 2],
      payableTotal: 670000,
    });

    expect(result[0]).toEqual({ discount_amount: 97500, payable_amount: 502500 });
    expect(result[1]).toEqual({ discount_amount: 32500, payable_amount: 167500 });
    expect(sumPayable(result)).toBe(cents(670000));
  });

  it('only applies the voucher to eligible products (apply_scope = product)', () => {
    const items: AllocatableItem[] = [
      { product_id: 1, price: 200000, quantity: 1 },
      { product_id: 2, price: 300000, quantity: 1 },
    ];

    const result = allocateItemDiscounts(items, {
      membershipDiscount: 0,
      voucherDiscount: 100000,
      eligibleProductIds: [1],
      payableTotal: 400000,
    });

    expect(result[0]).toEqual({ discount_amount: 100000, payable_amount: 100000 });
    expect(result[1]).toEqual({ discount_amount: 0, payable_amount: 300000 });
  });

  it('never allocates discounts to gift items (Buy X Get Y)', () => {
    const items: AllocatableItem[] = [
      { product_id: 1, price: 300000, quantity: 1 },
      { product_id: 99, price: 500000, quantity: 1, is_gift: true },
    ];

    const result = allocateItemDiscounts(items, {
      membershipDiscount: 0,
      voucherDiscount: 100000,
      eligibleProductIds: [1],
      payableTotal: 200000,
    });

    expect(result[0]).toEqual({ discount_amount: 100000, payable_amount: 200000 });
    expect(result[1]).toEqual({ discount_amount: 0, payable_amount: 0 });
  });
});

describe('allocateItemDiscounts – Edge cases & invariants', () => {
  it('returns an empty array for an empty order', () => {
    expect(allocateItemDiscounts([], {
      membershipDiscount: 50000,
      voucherDiscount: 50000,
      eligibleProductIds: [1],
      payableTotal: 0,
    })).toEqual([]);
  });

  it('keeps everything at 0 when the order only contains gift items', () => {
    const result = allocateItemDiscounts(
      [
        { product_id: 1, price: 0, quantity: 1, is_gift: true },
        { product_id: 2, price: 0, quantity: 2, is_gift: true },
      ],
      { membershipDiscount: 10000, voucherDiscount: 10000, eligibleProductIds: [], payableTotal: 0 }
    );

    expect(result).toEqual([
      { discount_amount: 0, payable_amount: 0 },
      { discount_amount: 0, payable_amount: 0 },
    ]);
  });

  it('never lets the total refund exceed what the customer actually paid (over-clamp guard)', () => {
    const items: AllocatableItem[] = [
      { product_id: 1, price: 100000, quantity: 1 }, // eligible, bị voucher "nuốt" hết
      { product_id: 2, price: 100000, quantity: 1 }, // không thuộc phạm vi voucher
    ];

    const result = allocateItemDiscounts(items, {
      membershipDiscount: 10000,   // 10%
      voucherDiscount: 100000,     // 100% của item 1 → vượt sức chịu của item 1
      eligibleProductIds: [1],
      payableTotal: 90000,         // 200k - 10k - 100k = 90k (số tiền khách thực trả)
    });

    result.forEach(allocation => expect(allocation.payable_amount).toBeGreaterThanOrEqual(0));
    expect(sumPayable(result)).toBe(cents(90000));
  });

  it('keeps all invariants (no cent drift) across typical scenarios', () => {
    const scenarios = [
      {
        items: [
          { product_id: 1, price: 99999.99, quantity: 1 },
          { product_id: 2, price: 99999.99, quantity: 1 },
          { product_id: 3, price: 99999.99, quantity: 1 },
        ] as AllocatableItem[],
        membershipDiscount: 0,
        voucherDiscount: 12345.67,
        eligibleProductIds: [1, 2, 3],
      },
      {
        items: [
          { product_id: 1, price: 149999.99, quantity: 2 },
          { product_id: 2, price: 99999.99, quantity: 1 },
          { product_id: 3, price: 0, quantity: 1, is_gift: true },
        ] as AllocatableItem[],
        membershipDiscount: 29999.9975,
        voucherDiscount: 49999.99,
        eligibleProductIds: [1],
      },
      {
        items: [
          { product_id: 1, price: 100000, quantity: 1 },
          { product_id: 2, price: 100000, quantity: 1 },
        ] as AllocatableItem[],
        membershipDiscount: 10000,
        voucherDiscount: 100000,
        eligibleProductIds: [1],
      },
      {
        items: [{ product_id: 1, price: 250000, quantity: 3 }] as AllocatableItem[],
        membershipDiscount: 45000,
        voucherDiscount: 105000,
        eligibleProductIds: [1],
      },
    ];

    for (const scenario of scenarios) {
      const itemTotalCents = scenario.items.reduce((sum, item) => sum + cents(item.price * item.quantity), 0);
      const payableTotalCents = itemTotalCents - cents(scenario.membershipDiscount) - cents(scenario.voucherDiscount);

      const result = allocateItemDiscounts(scenario.items, {
        membershipDiscount: scenario.membershipDiscount,
        voucherDiscount: scenario.voucherDiscount,
        eligibleProductIds: scenario.eligibleProductIds,
        payableTotal: payableTotalCents / 100,
      });

      // 1. Tổng payable = đúng số tiền hàng khách đã trả
      expect(sumPayable(result)).toBe(payableTotalCents);

      // 2. payable >= 0 và discount + payable = price * quantity
      result.forEach((allocation, index) => {
        const item = scenario.items[index];
        expect(allocation.payable_amount).toBeGreaterThanOrEqual(0);
        expect(cents(allocation.discount_amount + allocation.payable_amount))
          .toBe(cents(item.price * item.quantity));
      });
    }
  });

  it('does not mutate the input items', () => {
    const items: AllocatableItem[] = [
      { product_id: 1, price: 300000, quantity: 1 },
      { product_id: 2, price: 200000, quantity: 1 },
    ];
    const snapshot = JSON.stringify(items);

    allocateItemDiscounts(items, {
      membershipDiscount: 10000,
      voucherDiscount: 100000,
      eligibleProductIds: [1, 2],
      payableTotal: 390000,
    });

    expect(JSON.stringify(items)).toBe(snapshot);
  });
});