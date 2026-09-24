import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^[0-9]{10,11}$/, 'Phone must be 10-11 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const applyVoucherSchema = z.object({
  code: z.string().min(1, 'Voucher code is required').max(50),
  orderTotal: z.number().positive('Order total must be positive'),
});

export const createOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          product_detail_id: z.number().int().positive(),
          quantity: z.number().int().positive(),
        })
      )
      .min(1, 'Order must have at least one item'),
    shipping_address: z.string().min(5, 'Shipping address is required'),
    payment_method: z.enum(['COD', 'MOMO', 'VNPAY']),
    phone: z
      .string()
      .regex(/^[0-9]{10,11}$/, 'Phone must be 10-11 digits')
      .optional(),
    voucher_code: z.string().optional(),
    note: z.string().max(500).optional(),
  })
  .passthrough(); // allow extra fields (promotion items, etc.)
