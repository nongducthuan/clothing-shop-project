import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * QUY ƯỚC — "bẫy strip" của zod: `z.object({...})` mặc định XOÁ key không khai báo.
 * Middleware này gán `req.body = result.data` nên field bị xoá sẽ đến controller dưới
 * dạng `undefined` → TypeError → 500 (đây là nguyên nhân gốc của lỗi áp voucher).
 * Vì vậy: khai báo ĐỦ mọi field controller đọc, thêm `.passthrough()` cho payload phức
 * tạp, và mọi lần xoá field đều bị `console.warn` bên dưới để không còn lỗi âm thầm.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const rawBody =
      req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message || 'Invalid value',
      }));
      res.status(400).json({ message: 'Validation failed', errors });
      return;
    }

    // Phát hiện field bị zod strip (xem quy ước ở đầu file). Chỉ log, KHÔNG đổi
    // hành vi: strip vẫn là lớp bảo vệ chống mass-assignment.
    // Guard: chỉ so sánh khi parsed data là object (một schema phi-object sẽ khiến
    // `key in parsed` ném TypeError → middleware crash cho MỌI request).
    const parsed: unknown = result.data;
    const dropped =
      parsed && typeof parsed === 'object'
        ? Object.keys(rawBody).filter((key) => !(key in parsed))
        : [];

    if (dropped.length > 0) {
      console.warn(
        `[validate] ${req.method} ${req.originalUrl || req.url} — schema đã XOÁ ${dropped.length} ` +
          `field không khai báo: ${dropped.join(', ')}. Nếu controller còn dùng field này, ` +
          `hãy bổ sung vào schema (hoặc .passthrough()).`
      );
    }

    req.body = result.data;
    next();
  };
}
