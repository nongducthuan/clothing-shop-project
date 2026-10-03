import { z } from 'zod';

/** Số lượng dòng hàng: bắt buộc là số nguyên dương (dùng chung cart/order item). */
const positiveQuantitySchema = z.coerce
  .number({ error: 'Quantity must be a positive integer' })
  .int('Quantity must be a positive integer')
  .positive('Quantity must be a positive integer');

/**
 * QUY ƯỚC: zod 4 dùng message tiếng Anh mặc định cho constraint không có message riêng
 * (`Too big: ...`, `Invalid input: ...`, `Invalid option: ...`). Middleware forward
 * thẳng `issue.message` cho frontend ⇒ MỌI constraint phải truyền message tường minh,
 * và message đó phải có key `api_msg.<message>` trong translations.ts.
 */
export const registerSchema = z.object({
  name: z
    .string({ error: 'Name must be at least 2 characters' })
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name is too long (max 255 characters)'),
  email: z.string({ error: 'Invalid email format' }).email('Invalid email format'),
  phone: z.string({ error: 'Phone must be 10-11 digits' }).regex(/^[0-9]{10,11}$/, 'Phone must be 10-11 digits'),
  password: z
    .string({ error: 'Password must be at least 6 characters' })
    .min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  identifier: z.string({ error: 'Email or phone is required' }).min(1, 'Email or phone is required'),
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ error: 'Current password is required' })
    .min(1, 'Current password is required'),
  newPassword: z
    .string({ error: 'New password must be at least 6 characters' })
    .min(6, 'New password must be at least 6 characters'),
});

/**
 * Cart item as sent by the frontend (frontend/src/utils/useCartPage.ts → `cart`).
 * `id` là product id (CartItem.id), `quantity` là số lượng.
 * `product_id` được chấp nhận như alias.
 * `.passthrough()` là BẮT BUỘC: voucherController đọc trực tiếp các field này,
 * mà zod mặc định strip (xóa) mọi key không khai báo → gây lỗi 500.
 */
const cartItemSchema = z
  .object({
    id: z.union([z.number(), z.string()], { error: 'Invalid cart item' }).optional(),
    product_id: z.union([z.number(), z.string()], { error: 'Invalid cart item' }).optional(),
    quantity: positiveQuantitySchema,
  })
  .passthrough();

export const applyVoucherSchema = z.object({
  code: z
    .string({ error: 'Voucher code is required' })
    .min(1, 'Voucher code is required')
    .max(50, 'Voucher code is too long'),
  // Cho phép 0 (giỏ hàng rỗng / subtotal sau giảm hạng = 0) để controller trả
  // thông báo NGHIỆP VỤ dễ hiểu, thay vì chặn bằng lỗi validation chung chung.
  orderTotal: z.number({ error: 'Invalid order total' }).nonnegative('Invalid order total'),
  // Tiền hàng GỐC (trước membership/voucher) — CHỈ dùng để kiểm tra điều kiện "đơn tối thiểu".
  // Optional để tương thích ngược; thiếu thì controller fallback về orderTotal.
  subtotal: z.number({ error: 'Invalid subtotal' }).nonnegative('Invalid subtotal').optional(),
  // Phải forward xuống controller: với scope 'product'/'category' controller
  // tự tính lại phần tiền đủ điều kiện từ chính các item này.
  cartItems: z.array(cartItemSchema, { error: 'Invalid cart items' }).optional(),
});

/**
 * Kiểm tra SĐT "nới lỏng" cho luồng ĐẶT HÀNG.
 *
 * Khác với `registerSchema.phone` (người dùng TỰ NHẬP khi đăng ký → giữ chặt 10-11 số),
 * ở đây `phone` có thể lấy từ DB (`users.phone`) với đủ định dạng đã từng được lưu:
 * `+84901234567`, `84901234567`, `090 123 4567`, `090.123.4567`, `(090) 123-4567`.
 * Chỉ cần: ký tự hợp lệ, ngoặc cân đối, và 9-15 chữ số (chuẩn E.164 tối đa 15).
 * `''` được chấp nhận để không chặn khách thiếu SĐT.
 */
function isLoosePhoneNumber(value: string): boolean {
  if (value === '') return true;
  // Chỉ cho phép: + (chỉ ở đầu), chữ số, khoảng trắng, chấm, gạch ngang, ngoặc
  if (!/^\+?[0-9()\s.-]+$/.test(value)) return false;

  const openParens = (value.match(/\(/g) || []).length;
  const closeParens = (value.match(/\)/g) || []).length;
  if (openParens !== closeParens) return false;

  const digitCount = (value.match(/[0-9]/g) || []).length;
  return digitCount >= 9 && digitCount <= 15;
}

/**
 * Order item as sent by the frontend (useCheckoutPage → itemsPayload).
 * `product_id` + `quantity` là bắt buộc; các field size/color/gift/promotion
 * là tuỳ chọn nhưng PHẢI được giữ lại → `.passthrough()`.
 */
const orderItemSchema = z
  .object({
    product_id: z.coerce
      .number({ error: 'Invalid product id' })
      .int('Invalid product id')
      .positive('Invalid product id'),
    quantity: positiveQuantitySchema,
  })
  .passthrough();

export const createOrderSchema = z
  .object({
    items: z
      .array(orderItemSchema, { error: 'Order must have at least one item' })
      .min(1, 'Order must have at least one item'),
    // Bảng orders + controller dùng `address` (không phải `shipping_address`).
    address: z.string({ error: 'Invalid address' }).optional(),
    // DB enum lưu chữ thường ('cod' | 'momo' | 'vnpay') và controller so sánh
    // bằng giá trị chữ thường → schema phải khớp.
    payment_method: z
      .enum(['cod', 'momo', 'vnpay'], { error: 'Invalid payment method' })
      .optional(),
    // Nới lỏng định dạng SĐT: SĐT của user ĐÃ ĐĂNG NHẬP lấy từ DB (users.phone) có
    // thể ở dạng "+84901234567", "090 123 4567"... — khác regex 10-11 số của
    // registerSchema → trước đây làm hỏng cả luồng đặt hàng (400 Validation failed).
    // Vẫn cho phép chuỗi rỗng để không chặn user thiếu SĐT.
    // DB: orders.phone / users.phone đều là VARCHAR(20) → max(20) cho khớp.
    phone: z
      .string({ error: 'Invalid phone number format' })
      .trim()
      .max(20, 'Phone number is too long')
      .refine(isLoosePhoneNumber, 'Invalid phone number format')
      .optional(),
    voucher_id: z
      .union([z.number(), z.string(), z.null()], { error: 'Invalid voucher id' })
      .optional(),
    voucher_code: z.string({ error: 'Invalid voucher code' }).optional(),
    note: z
      .string({ error: 'Invalid note' })
      .max(500, 'Note is too long (max 500 characters)')
      .optional(),

    // ── Field controller THỰC SỰ đọc nhưng không cần validate: khai báo tường minh
    // bằng `z.unknown()` để chúng không bị strip mà cũng không sinh thêm lỗi 400.
    // (Trước đây chúng chỉ "sống sót" nhờ `.passthrough()` — ai xoá là hỏng checkout,
    // đúng kiểu lỗi đã xảy ra với `cartItems` của voucher. Tiền/số lượng server tự
    // tính lại, không tin client.)
    name: z.unknown().optional(),
    email: z.unknown().optional(),
    shipping_fee: z.unknown().optional(),
    // `total_price` / `user_id` do frontend gửi kèm nhưng server tự tính lại / tự
    // lấy từ token → khai báo để không bị strip, không dùng làm nguồn tin cậy.
    total_price: z.unknown().optional(),
    user_id: z.unknown().optional(),
  })
  .passthrough(); // vẫn giữ: field MỚI ở frontend sẽ không bị xoá âm thầm
