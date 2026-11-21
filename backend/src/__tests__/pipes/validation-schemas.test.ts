import fs from 'fs';
import path from 'path';
import { z, ZodType } from 'zod';
import { BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  applyVoucherSchema,
  createOrderSchema,
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../../types/schemas';

function validate<T>(schema: ZodType<T>, body: unknown): T {
  const pipe = new ZodValidationPipe(schema);
  return pipe.transform(body) as T;
}

function expectValidationFailure<T>(schema: ZodType<T>, body: unknown): Record<string, unknown> {
  try {
    validate(schema, body);
    throw new Error('Expected validation to fail');
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    return (error as BadRequestException).getResponse() as Record<string, unknown>;
  }
}

/**
 * Regression: schema phải khớp "hợp đồng" API thực tế (từng lệch ở
 * /vouchers/apply → 500 và /orders → 400).
 */
describe('ZodValidationPipe + applyVoucherSchema', () => {
  it('giữ nguyên cartItems sau khi validate (không bị zod strip)', () => {
    const body = {
      code: 'SAVE10',
      orderTotal: 500000,
      cartItems: [{ id: 1, product_id: 1, quantity: 2, color_id: 3, size_id: 4 }],
    };

    const transformed = validate(applyVoucherSchema, body) as Record<string, unknown> & { cartItems: Array<Record<string, unknown>> };

    expect(transformed.cartItems).toEqual([
      expect.objectContaining({ id: 1, product_id: 1, quantity: 2 }),
    ]);
    expect(transformed.cartItems[0]).toMatchObject({ color_id: 3, size_id: 4 });
  });

  it('trả 400 Validation failed khi thiếu orderTotal', () => {
    const errorResponse = expectValidationFailure(applyVoucherSchema, { code: 'SAVE10' });
    expect(errorResponse).toMatchObject({ message: 'Validation failed' });
  });

  it('vẫn trả 400 khi orderTotal là số âm', () => {
    expectValidationFailure(applyVoucherSchema, { code: 'SAVE10', orderTotal: -1 });
  });

  it('cho phép orderTotal = 0 để controller trả thông báo nghiệp vụ thay vì lỗi validation', () => {
    const transformed = validate(applyVoucherSchema, { code: 'SAVE10', orderTotal: 0, cartItems: [] });
    expect(transformed).toMatchObject({ code: 'SAVE10', orderTotal: 0 });
  });
});

describe('ZodValidationPipe + createOrderSchema', () => {
  it('chấp nhận payload checkout thực tế của frontend', () => {
    const body = {
      user_id: null,
      total_price: 530000,
      voucher_id: 5,
      address: '12 Nguyen Trai, Ha Noi',
      phone: '0900000000',
      name: 'Khach',
      email: 'khach@example.com',
      payment_method: 'cod',
      shipping_fee: 30000,
      items: [
        { product_id: 25, color_id: 1, size_id: 2, quantity: 2, price: 200000, is_gift: false },
        { product_id: 33, quantity: 1, price: 0, is_gift: true, promotion_id: 5 },
      ],
    };

    const transformed = validate(createOrderSchema, body) as Record<string, unknown> & { items: Array<Record<string, unknown>> };

    expect(transformed).toMatchObject({
      address: '12 Nguyen Trai, Ha Noi',
      payment_method: 'cod',
      shipping_fee: 30000,
      voucher_id: 5,
    });

    expect(transformed.items[0]).toMatchObject({ product_id: 25, color_id: 1, size_id: 2, is_gift: false });
    expect(transformed.items[1]).toMatchObject({ product_id: 33, is_gift: true, promotion_id: 5 });
  });

  it('trả 400 khi items rỗng', () => {
    const errorResponse = expectValidationFailure(createOrderSchema, { address: 'Ha Noi', items: [] });
    expect(errorResponse).toMatchObject({ message: 'Validation failed' });
  });

  it('trả 400 khi payment_method không nằm trong cod/momo/vnpay', () => {
    const errorResponse = expectValidationFailure(createOrderSchema, {
      address: 'Ha Noi',
      payment_method: 'COD',
      items: [{ product_id: 25, quantity: 1 }],
    });
    expect(errorResponse.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'payment_method' })])
    );
  });

  it('chấp nhận SĐT đa định dạng từ DB user (+84, khoảng trắng) — không chặn đặt hàng', () => {
    const accepted = [
      '+84901234567',
      '090 123 4567',
      '(090) 123-4567',
      '090.123.4567',
      '',
      '84901234567',
    ];

    for (const phone of accepted) {
      const transformed = validate(createOrderSchema, {
        address: 'Ha Noi',
        phone,
        items: [{ product_id: 25, quantity: 1 }],
      }) as Record<string, unknown>;
      expect(transformed.phone).toBe(phone);
    }
  });

  it('vẫn chặn SĐT rác hoặc quá dài (VARCHAR(20))', () => {
    const rejected = [
      'abc',
      '090@123',
      '0'.repeat(21),
      '((090) 123',
      '12345',
    ];

    for (const phone of rejected) {
      expectValidationFailure(createOrderSchema, {
        address: 'Ha Noi',
        phone,
        items: [{ product_id: 25, quantity: 1 }],
      });
    }
  });
});

describe('contract: payload frontend phải sống sót qua ZodValidationPipe', () => {
  const routes: Array<{ route: string; schema: ZodType; body: Record<string, unknown> }> = [
    {
      route: 'POST /auth/register',
      schema: registerSchema,
      body: { name: 'Khach', email: 'khach@example.com', phone: '0900000000', password: 'password123' },
    },
    {
      route: 'POST /auth/login',
      schema: loginSchema,
      body: { identifier: 'khach@example.com', password: '123456' },
    },
    {
      route: 'PUT /auth/password',
      schema: changePasswordSchema,
      body: { currentPassword: 'password123', newPassword: 'newpassword123' },
    },
    {
      route: 'POST /vouchers/apply',
      schema: applyVoucherSchema,
      body: {
        code: 'SAVE10',
        orderTotal: 500000,
        cartItems: [
          {
            id: 25,
            product_id: 25,
            name: 'Heavyweight Tee',
            price: 250000,
            quantity: 2,
            color_id: 1,
            size_id: 2,
            stock: 9,
          },
        ],
      },
    },
    {
      route: 'POST /orders',
      schema: createOrderSchema,
      body: {
        user_id: null,
        total_price: 530000,
        voucher_id: 5,
        address: '12 Nguyen Trai, Ha Noi',
        phone: '+84901234567',
        name: 'Khach',
        email: 'khach@example.com',
        payment_method: 'cod',
        shipping_fee: 30000,
        items: [
          {
            product_id: 25,
            color_id: 1,
            size_id: 2,
            quantity: 2,
            price: 250000,
            is_gift: false,
          },
          { product_id: 33, quantity: 1, price: 0, is_gift: true, promotion_id: 5 },
        ],
      },
    },
  ];

  it.each(routes)('$route — không field nào bị zod xoá', ({ schema, body }) => {
    const transformed = validate(schema, JSON.parse(JSON.stringify(body))) as Record<string, unknown>;

    const missing = Object.keys(body).filter((key) => !(key in transformed));
    expect(missing).toEqual([]);

    for (const listKey of ['items', 'cartItems'] as const) {
      const expected = body[listKey] as Record<string, unknown>[] | undefined;
      const actual = transformed[listKey] as Record<string, unknown>[] | undefined;
      if (Array.isArray(expected)) {
        expect(actual).toBeDefined();
        expect(Object.keys(expected[0]).sort()).toEqual(Object.keys(actual![0]).sort());
      }
    }
  });

  it('field của controller (name/email/shipping_fee) được KHAI BÁO trong schema', () => {
    const shape = createOrderSchema.shape as Record<string, unknown>;
    for (const key of ['name', 'email', 'shipping_fee', 'address', 'phone', 'items']) {
      expect(Object.keys(shape)).toContain(key);
    }
  });

  it('ZodValidationPipe loại bỏ các field lạ không khai báo trong strict schemas', () => {
    const transformed = validate(loginSchema, {
      identifier: 'a@b.com',
      password: '123456',
      fieldThatDoesNotExistYet: 'x',
    }) as Record<string, unknown>;

    expect(transformed).not.toHaveProperty('fieldThatDoesNotExistYet');
  });

  it('không crash khi body không phải object', () => {
    for (const body of [undefined, null, [1, 2], 'chuoi', 5]) {
      expect(() => validate(loginSchema, body)).toThrow(BadRequestException);
    }
  });
});

describe('message validation của schema phải dịch được ở frontend', () => {
  const translationsPath = path.resolve(
    __dirname,
    '../../../../frontend/src/locales/translations.ts'
  );

  const invalidPayloads: Array<{ name: string; schema: ZodType; body: unknown }> = [
    { name: 'register rỗng', schema: registerSchema, body: {} },
    {
      name: 'register sai định dạng',
      schema: registerSchema,
      body: { name: 'a', email: 'bad', phone: 'abc', password: '123' },
    },
    {
      name: 'register name quá dài',
      schema: registerSchema,
      body: { name: 'a'.repeat(300), email: 'a@b.com', phone: '0900000000', password: 'password123' },
    },
    { name: 'login rỗng', schema: loginSchema, body: {} },
    { name: 'change password rỗng', schema: changePasswordSchema, body: {} },
    {
      name: 'voucher sai kiểu',
      schema: applyVoucherSchema,
      body: { code: '', orderTotal: 'x', cartItems: 'x' },
    },
    {
      name: 'voucher code quá dài + item sai',
      schema: applyVoucherSchema,
      body: { code: 'A'.repeat(60), orderTotal: 1, cartItems: [{ quantity: 'x' }] },
    },
    { name: 'order items rỗng', schema: createOrderSchema, body: { items: [] } },
    { name: 'order item rỗng', schema: createOrderSchema, body: { items: [{}] } },
    {
      name: 'order item sai kiểu',
      schema: createOrderSchema,
      body: { items: [{ product_id: 'abc', quantity: 0 }] },
    },
    {
      name: 'order payment_method viết hoa',
      schema: createOrderSchema,
      body: { items: [{ product_id: 1, quantity: 1 }], payment_method: 'COD' },
    },
    {
      name: 'order phone rác',
      schema: createOrderSchema,
      body: { items: [{ product_id: 1, quantity: 1 }], phone: 'abc' },
    },
    {
      name: 'order phone quá dài',
      schema: createOrderSchema,
      body: { items: [{ product_id: 1, quantity: 1 }], phone: '0'.repeat(21) },
    },
    {
      name: 'order address sai kiểu',
      schema: createOrderSchema,
      body: { items: [{ product_id: 1, quantity: 1 }], address: 5 },
    },
    {
      name: 'order voucher_id sai kiểu',
      schema: createOrderSchema,
      body: { items: [{ product_id: 1, quantity: 1 }], voucher_id: {} },
    },
    {
      name: 'order note quá dài',
      schema: createOrderSchema,
      body: { items: [{ product_id: 1, quantity: 1 }], note: 'x'.repeat(501) },
    },
  ];

  const skipIfNoFrontend = !fs.existsSync(translationsPath);

  (skipIfNoFrontend ? it.skip : it)(
    'mọi message lỗi của 5 schema đều có key api_msg.* (không lọt tiếng Anh mặc định)',
    () => {
      const source = fs.readFileSync(translationsPath, 'utf8');
      const translatedKeys = new Set(
        Array.from(source.matchAll(/'api_msg\.([^']+)':/g)).map((m) => m[1])
      );
      expect(translatedKeys.size).toBeGreaterThan(50);

      const seen = new Set<string>();
      const untranslated: string[] = [];
      const zodDefaults: string[] = [];

      for (const { name, schema, body } of invalidPayloads) {
        const result = schema.safeParse(body);
        if (result.success) {
          throw new Error(`payload "${name}" phải invalid nhưng lại parse thành công`);
        }

        const issues = result.error.issues;
        if (issues.length === 0) throw new Error(`payload "${name}" phải có ít nhất 1 issue`);

        for (const issue of issues) {
          const message: string = issue.message || 'Invalid value';
          seen.add(message);

          if (/^(Invalid input|Too big:|Too small:|Invalid option:|Invalid string)/.test(message)) {
            zodDefaults.push(`"${name}": ${message}`);
          }
          if (!translatedKeys.has(message)) {
            untranslated.push(`"${name}": ${message}`);
          }
        }
      }

      expect({ zodDefaults, untranslated }).toEqual({ zodDefaults: [], untranslated: [] });
      expect(seen).toContain('Invalid phone number format');
      expect(seen).toContain('Invalid payment method');
      expect(seen).toContain('Voucher code is required');
    }
  );
});
