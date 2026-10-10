import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { z, ZodType } from 'zod';
import { validate } from '../../middleware/validateMiddleware';
import {
  applyVoucherSchema,
  createOrderSchema,
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../../types/schemas';

/** Creates a minimal mock Express Response with jest.fn() for json/status */
function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

/** Creates a mock Request carrying the given JSON body */
function mockReq(body: unknown): Request {
  return { body, headers: {} } as unknown as Request;
}

/**
 * Regression: schema phải khớp "hợp đồng" API thực tế (từng lệch ở
 * /vouchers/apply → 500 và /orders → 400).
 */
describe('validate + applyVoucherSchema', () => {
  beforeEach(() => jest.clearAllMocks());

  it('giữ nguyên cartItems sau khi validate (không bị zod strip)', () => {
    const req = mockReq({
      code: 'SAVE10',
      orderTotal: 500000,
      cartItems: [{ id: 1, product_id: 1, quantity: 2, color_id: 3, size_id: 4 }],
    });
    const res = mockRes();
    const next: NextFunction = jest.fn();

    validate(applyVoucherSchema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    // cartItems phải còn nguyên để voucherController tính eligibleTotal
    expect(req.body.cartItems).toEqual([
      expect.objectContaining({ id: 1, product_id: 1, quantity: 2 }),
    ]);
    expect(req.body.cartItems[0]).toMatchObject({ color_id: 3, size_id: 4 });
  });

  it('trả 400 Validation failed khi thiếu orderTotal', () => {
    const req = mockReq({ code: 'SAVE10' });
    const res = mockRes();
    const next: NextFunction = jest.fn();

    validate(applyVoucherSchema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Validation failed' })
    );
  });

  it('vẫn trả 400 khi orderTotal là số âm', () => {
    const req = mockReq({ code: 'SAVE10', orderTotal: -1 });
    const res = mockRes();
    const next: NextFunction = jest.fn();

    validate(applyVoucherSchema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('cho phép orderTotal = 0 để controller trả thông báo nghiệp vụ thay vì lỗi validation', () => {
    const req = mockReq({ code: 'SAVE10', orderTotal: 0, cartItems: [] });
    const res = mockRes();
    const next: NextFunction = jest.fn();

    validate(applyVoucherSchema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('validate + createOrderSchema', () => {
  beforeEach(() => jest.clearAllMocks());

  it('chấp nhận payload checkout thực tế của frontend', () => {
    const req = mockReq({
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
    });
    const res = mockRes();
    const next: NextFunction = jest.fn();

    validate(createOrderSchema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();

    // Các field ngoài schema vẫn được giữ (passthrough) cho controller dùng
    expect(req.body).toMatchObject({
      address: '12 Nguyen Trai, Ha Noi',
      payment_method: 'cod',
      shipping_fee: 30000,
      voucher_id: 5,
    });

    // Field tuỳ chọn của item phải còn nguyên → nếu bị strip, size/quà tặng sẽ mất
    expect(req.body.items[0]).toMatchObject({ product_id: 25, color_id: 1, size_id: 2, is_gift: false });
    expect(req.body.items[1]).toMatchObject({ product_id: 33, is_gift: true, promotion_id: 5 });
  });

  it('trả 400 khi items rỗng', () => {
    const req = mockReq({ address: 'Ha Noi', items: [] });
    const res = mockRes();
    const next: NextFunction = jest.fn();

    validate(createOrderSchema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Validation failed' })
    );
  });

  it('trả 400 khi payment_method không nằm trong cod/momo/vnpay', () => {
    const req = mockReq({
      address: 'Ha Noi',
      payment_method: 'COD',
      items: [{ product_id: 25, quantity: 1 }],
    });
    const res = mockRes();
    const next: NextFunction = jest.fn();

    validate(createOrderSchema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.errors).toEqual(
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
      const req = mockReq({
        address: 'Ha Noi',
        phone,
        items: [{ product_id: 25, quantity: 1 }],
      });
      const res = mockRes();
      const next: NextFunction = jest.fn();

      validate(createOrderSchema)(req, res, next);

      // Gộp vào 1 object để khi fail sẽ biết rõ SĐT nào sai
      // (jest không hỗ trợ tham số message thứ 2 trong expect()).
      expect({
        phone,
        nextCalled: (next as jest.Mock).mock.calls.length > 0,
        statusCalled: (res.status as jest.Mock).mock.calls.length > 0,
      }).toEqual({ phone, nextCalled: true, statusCalled: false });
    }
  });

  it('vẫn chặn SĐT rác hoặc quá dài (VARCHAR(20))', () => {
    const rejected = [
      'abc',           // có chữ cái
      '090@123',       // ký tự không hợp lệ
      '0'.repeat(21),  // vượt VARCHAR(20)
      '((090) 123',    // ngoặc không cân đối
      '12345',         // quá ít chữ số (SĐT VN cần >= 9)
    ];

    for (const phone of rejected) {
      const req = mockReq({
        address: 'Ha Noi',
        phone,
        items: [{ product_id: 25, quantity: 1 }],
      });
      const res = mockRes();
      const next: NextFunction = jest.fn();

      validate(createOrderSchema)(req, res, next);

      expect({
        phone,
        nextCalled: (next as jest.Mock).mock.calls.length > 0,
        status: (res.status as jest.Mock).mock.calls[0]?.[0],
      }).toEqual({ phone, nextCalled: false, status: 400 });
    }
  });
});

/**
 * Chốt contract: `validate()` gán `req.body = result.data` nên field nào không khai báo
 * sẽ bị zod xoá trước khi controller đọc (đây là lỗi đã xảy ra với `cartItems`).
 * Test dùng payload thật của frontend và khẳng định không field nào bị mất.
 */
describe('contract: payload frontend phải sống sót qua validate()', () => {
  /** Payload y như frontend gửi (copy từ hooks) */
  const routes: Array<{ route: string; schema: ZodType; body: Record<string, unknown> }> = [
    {
      route: 'POST /auth/register',
      schema: registerSchema,
      body: { name: 'Khach', email: 'khach@example.com', phone: '0900000000', password: '123456' },
    },
    {
      route: 'POST /auth/login',
      schema: loginSchema,
      body: { identifier: 'khach@example.com', password: '123456' },
    },
    {
      route: 'PUT /auth/password',
      schema: changePasswordSchema,
      body: { currentPassword: '123456', newPassword: 'abcdef' },
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
    const req = mockReq(JSON.parse(JSON.stringify(body)));
    const res = mockRes();
    const next: NextFunction = jest.fn();

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();

    // Field nào bị thiếu = field controller sẽ nhận `undefined`
    const missing = Object.keys(body).filter((key) => !(key in req.body));
    expect(missing).toEqual([]);

    // Field lồng trong mảng item cũng phải còn (size/quà tặng…)
    for (const listKey of ['items', 'cartItems'] as const) {
      const expected = body[listKey] as Record<string, unknown>[] | undefined;
      const actual = req.body[listKey] as Record<string, unknown>[] | undefined;
      if (Array.isArray(expected)) {
        expect(actual).toBeDefined();
        expect(Object.keys(expected[0]).sort()).toEqual(Object.keys(actual![0]).sort());
      }
    }
  });

  it('field của controller (name/email/shipping_fee) được KHAI BÁO trong schema', () => {
    // Ghi chú lý do: 3 field này từng chỉ "sống sót" nhờ `.passthrough()`; ai xoá là hỏng checkout.
    const shape = createOrderSchema.shape as Record<string, unknown>;
    for (const key of ['name', 'email', 'shipping_fee', 'address', 'phone', 'items']) {
      expect(Object.keys(shape)).toContain(key);
    }
  });

  it('middleware cảnh báo trong log khi schema thật sự xoá field (không còn âm thầm)', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    // loginSchema KHÔNG passthrough → gửi kèm field lạ sẽ bị xoá và phải được báo
    const req = mockReq({
      identifier: 'a@b.com',
      password: '123456',
      fieldThatDoesNotExistYet: 'x',
    });
    validate(loginSchema)(req, mockRes(), jest.fn());

    expect(req.body).not.toHaveProperty('fieldThatDoesNotExistYet');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('fieldThatDoesNotExistYet'));
    warn.mockRestore();
  });

  it('KHÔNG cảnh báo khi mọi field đều đã được khai báo', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    validate(loginSchema)(
      mockReq({ identifier: 'a@b.com', password: '123456' }),
      mockRes(),
      jest.fn()
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('không crash khi body không phải object hoặc schema trả về non-object', () => {
    const res = mockRes();
    const next: NextFunction = jest.fn();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    // body không phải object → zod báo lỗi 400, không được ném exception
    for (const body of [undefined, null, [1, 2], 'chuoi', 5]) {
      expect(() => validate(loginSchema)(mockReq(body), res, next)).not.toThrow();
    }

    // schema parse THÀNH CÔNG nhưng trả về non-object → `key in parsed` sẽ ném TypeError
    // nếu không có guard trong middleware
    const weirdSchema = z.unknown().transform(() => 'not-an-object');
    const req = mockReq({ a: 1 });
    expect(() => validate(weirdSchema)(req, res, jest.fn())).not.toThrow();
    expect(req.body).toBe('not-an-object');

    warn.mockRestore();
  });
});

/**
 * Mọi message mà các schema có thể sinh ra đều phải có bản dịch `api_msg.<message>`
 * trong translations.ts (middleware forward thẳng message cho frontend).
 */
describe('message validation của schema phải dịch được ở frontend', () => {
  const translationsPath = path.resolve(
    __dirname,
    '../../../../frontend/src/locales/translations.ts'
  );

  /** Payload sai cho từng schema, phủ hết các field/constraint */
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
      body: { name: 'a'.repeat(300), email: 'a@b.com', phone: '0900000000', password: '123456' },
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

          // 1. Không được là message mặc định của zod 4
          if (/^(Invalid input|Too big:|Too small:|Invalid option:|Invalid string)/.test(message)) {
            zodDefaults.push(`"${name}": ${message}`);
          }
          // 2. Phải có bản dịch api_msg.<message> ở frontend
          if (!translatedKeys.has(message)) {
            untranslated.push(`"${name}": ${message}`);
          }
        }
      }

      // Gộp danh sách thiếu vào 1 expect để khi fail biết ngay message nào cần bổ sung
      expect({ zodDefaults, untranslated }).toEqual({ zodDefaults: [], untranslated: [] });

      // Sanity: các thông báo nghiệp vụ quan trọng phải được chạm tới
      expect(seen).toContain('Invalid phone number format');
      expect(seen).toContain('Invalid payment method');
      expect(seen).toContain('Voucher code is required');
    }
  );
});
