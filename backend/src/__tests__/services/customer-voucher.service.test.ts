import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomerVoucherService } from '../../customer/services/customer-voucher.service';
import { PrismaService } from '../../prisma/prisma.service';

const prismaMock = {
  voucher: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
  },
  sale: {
    findMany: jest.fn(),
  },
};

const service = new CustomerVoucherService(prismaMock as unknown as PrismaService);

const baseVoucher = {
  id: 1,
  code: 'SAVE10',
  status: true,
  usage_limit: 100,
  start_date: null,
  end_date: null,
  apply_scope: 'all',
  min_order_value: 0,
  discount_percent: 10,
  max_discount_amount: null,
  product_vouchers: [],
  voucher_categories: [],
};

const cartItems = [
  { product_id: 1, quantity: 2 },
  { product_id: 2, quantity: 1 },
];

const dbProducts = [
  { id: 1, price: 200000, category_id: 10 },
  { id: 2, price: 150000, category_id: 20 },
];

describe('CustomerVoucherService.applyVoucher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.sale.findMany.mockResolvedValue([]);
  });

  it('should throw NotFoundException when voucher does not exist', async () => {
    prismaMock.voucher.findUnique.mockResolvedValueOnce(null);

    await expect(service.applyVoucher({ code: 'INVALID', orderTotal: 500000, cartItems }))
      .rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when voucher status is false (inactive)', async () => {
    prismaMock.voucher.findUnique.mockResolvedValueOnce({
      ...baseVoucher,
      status: false,
    });

    await expect(service.applyVoucher({ code: 'INACTIVE', orderTotal: 500000, cartItems }))
      .rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when usage_limit is exhausted (= 0)', async () => {
    prismaMock.voucher.findUnique.mockResolvedValueOnce({
      ...baseVoucher,
      usage_limit: 0,
    });

    await expect(service.applyVoucher({ code: 'SAVE10', orderTotal: 500000, cartItems }))
      .rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when voucher start_date is in the future', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    prismaMock.voucher.findUnique.mockResolvedValueOnce({
      ...baseVoucher,
      start_date: futureDate,
    });

    await expect(service.applyVoucher({ code: 'SAVE10', orderTotal: 500000, cartItems }))
      .rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when voucher end_date is in the past', async () => {
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    prismaMock.voucher.findUnique.mockResolvedValueOnce({
      ...baseVoucher,
      end_date: pastDate,
    });

    await expect(service.applyVoucher({ code: 'SAVE10', orderTotal: 500000, cartItems }))
      .rejects.toThrow(BadRequestException);
  });

  it('should apply 10% discount on full order total for scope=all', async () => {
    prismaMock.voucher.findUnique.mockResolvedValueOnce(baseVoucher);
    prismaMock.product.findMany.mockResolvedValueOnce(dbProducts);

    const orderTotal = 550000;
    const result = await service.applyVoucher({ code: 'SAVE10', orderTotal, cartItems });

    expect(result).toMatchObject({
      success: true,
      data: expect.objectContaining({
        discount_amount: orderTotal * 0.1,
        final_total: orderTotal - orderTotal * 0.1,
      }),
    });
  });

  it('không áp voucher hoặc giảm thành viên lên sản phẩm Buy X Get Y không cộng dồn', async () => {
    prismaMock.voucher.findUnique.mockResolvedValueOnce(baseVoucher);
    prismaMock.product.findMany.mockResolvedValueOnce(dbProducts);

    const result = await service.applyVoucher({
      code: 'SAVE10',
      subtotal: 550000,
      orderTotal: 520000,
      membershipDiscountableSubtotal: 150000,
      cartItems: [
        { product_id: 1, quantity: 2, block_other_discounts: true },
        { product_id: 2, quantity: 1, block_other_discounts: false },
      ],
    });

    expect(result).toMatchObject({
      success: true,
      data: expect.objectContaining({
        applied_to_total: 120000,
        discount_amount: 12000,
        final_total: 508000,
      }),
    });
  });

  it('rounds sale price and voucher amount to the same whole-VND values as checkout', async () => {
    prismaMock.voucher.findUnique.mockResolvedValueOnce({
      ...baseVoucher,
      discount_percent: 50,
      max_discount_amount: null,
    });
    prismaMock.product.findMany.mockResolvedValueOnce([
      { id: 3, price: 999, category_id: 10 },
    ]);
    prismaMock.sale.findMany.mockResolvedValueOnce([{
      id: 20,
      status: true,
      start_date: new Date(Date.now() - 60_000),
      end_date: new Date(Date.now() + 60_000),
      apply_scope: 'all',
      discount_percent: 10,
      product_sales: [],
      sale_categories: [],
    }]);

    const result = await service.applyVoucher({
      code: 'SAVE10',
      orderTotal: 899,
      cartItems: [{ product_id: 3, quantity: 1 }],
    });

    expect(result).toMatchObject({
      success: true,
      data: expect.objectContaining({
        applied_to_total: 899,
        discount_amount: 450,
        final_total: 449,
      }),
    });
  });

  it('should cap discount at max_discount_amount', async () => {
    prismaMock.voucher.findUnique.mockResolvedValueOnce({
      ...baseVoucher,
      discount_percent: 50,
      max_discount_amount: 30000,
    });
    prismaMock.product.findMany.mockResolvedValueOnce(dbProducts);

    const orderTotal = 550000;
    const result = await service.applyVoucher({ code: 'SAVE10', orderTotal, cartItems });

    expect(result).toMatchObject({
      success: true,
      data: expect.objectContaining({
        discount_amount: 30000,
        final_total: orderTotal - 30000,
      }),
    });
  });

  it('should throw BadRequestException when order total is below min_order_value', async () => {
    prismaMock.voucher.findUnique.mockResolvedValueOnce({
      ...baseVoucher,
      min_order_value: 1000000,
    });
    prismaMock.product.findMany.mockResolvedValueOnce(dbProducts);

    await expect(service.applyVoucher({ code: 'SAVE10', orderTotal: 200000, cartItems }))
      .rejects.toThrow(BadRequestException);
  });

  it('kiểm tra "đơn tối thiểu" theo TIỀN HÀNG gốc — tiền hàng đủ thì vẫn áp dụng dù tiền sau giảm hạng thấp hơn', async () => {
    prismaMock.voucher.findUnique.mockResolvedValueOnce({
      ...baseVoucher,
      min_order_value: 300000,
    });
    prismaMock.product.findMany.mockResolvedValueOnce(dbProducts);

    const result = await service.applyVoucher({ code: 'SAVE10', orderTotal: 200000, subtotal: 480000, cartItems });

    expect(result).toMatchObject({ success: true });
  });

  it('vẫn báo lỗi "đơn tối thiểu" khi TIỀN HÀNG gốc chưa đạt (subtotal < min_order_value)', async () => {
    prismaMock.voucher.findUnique.mockResolvedValueOnce({
      ...baseVoucher,
      min_order_value: 500000,
    });
    prismaMock.product.findMany.mockResolvedValueOnce(dbProducts);

    await expect(service.applyVoucher({
      code: 'SAVE10',
      orderTotal: 200000,
      subtotal: 250000,
      cartItems: [{ product_id: 1, quantity: 1 }],
    })).rejects.toThrow(BadRequestException);
  });
});
