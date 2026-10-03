import { describe, it, expect } from 'vitest';
import { translations } from './translations';
import { API_MESSAGE_PATTERNS, matchApiMessagePattern } from './apiMessagePatterns';

/** Giả lập t()/translateApiMessage của LanguageContext cho locale vi/en */
function makeTranslate(lang: 'vi' | 'en') {
  const dict = translations[lang] as unknown as Record<string, string>;
  return (key: string, fallback?: string): string => dict[key] ?? fallback ?? key;
}

const tVi = makeTranslate('vi');
const tEn = makeTranslate('en');

describe('apiMessagePatterns – bản dịch', () => {
  it('mọi pattern đều có template ở CẢ 2 locale', () => {
    for (const p of API_MESSAGE_PATTERNS) {
      expect(translations.vi, `thiếu ${p.key} (vi)`).toHaveProperty(p.key);
      expect(translations.en, `thiếu ${p.key} (en)`).toHaveProperty(p.key);
    }
  });

  it('dịch message động sang tiếng Việt và giữ nguyên tham số', () => {
    expect(matchApiMessagePattern('Invalid OTP code! 3 attempt(s) remaining.', tVi)).toBe(
      'Mã OTP không đúng! Còn 3 lần nhập.'
    );
    expect(matchApiMessagePattern('Please select a size for product "Heavyweight Tee"', tVi)).toBe(
      'Vui lòng chọn size cho sản phẩm "Heavyweight Tee".'
    );
    expect(
      matchApiMessagePattern('Insufficient stock for product "Tee" (size_id=12)', tVi)
    ).toContain('"Tee"');
    expect(matchApiMessagePattern('Order #777 not found.', tVi)).toBe(
      'Không tìm thấy đơn hàng #777.'
    );
    expect(
      matchApiMessagePattern('Invalid return quantity for item ID 5. Must be between 1 and 2.', tVi)
    ).toContain('1 đến 2');
    expect(
      matchApiMessagePattern('Gift item "Sweat Shorts" is missing promotion reference.', tVi)
    ).toContain('"Sweat Shorts"');
    expect(
      matchApiMessagePattern('Invalid shipping fee: must be between 0 and 100000.', tVi)
    ).toContain('100000');
  });

  it('vẫn trả tiếng Anh đúng khi locale là en', () => {
    const msg = 'Invalid OTP code! 3 attempt(s) remaining.';
    expect(matchApiMessagePattern(msg, tEn)).toBe(msg);
  });

  it('trả null khi message không khớp pattern (caller giữ nguyên gốc)', () => {
    expect(matchApiMessagePattern('Some brand new backend error', tVi)).toBeNull();
  });
});

describe('translations – các message lỗi backend trước đây hiển thị tiếng Anh', () => {
  it('các message hay gặp đã có bản dịch tiếng Việt (khác tiếng Anh)', () => {
    const mustTranslate = [
      'api_msg.Validation failed',
      'api_msg.Something went very wrong!',
      'api_msg.Too many login attempts. Please try again in 15 minutes.',
      'api_msg.Voucher has expired.',
      'api_msg.Voucher usage limit reached.',
      'api_msg.Voucher is not applicable to any products in this order.',
    ];
    for (const key of mustTranslate) {
      expect(translations.vi, `thiếu ${key}`).toHaveProperty(key);
      expect(translations.vi[key as keyof typeof translations.vi]).not.toBe(
        translations.en[key as keyof typeof translations.en]
      );
    }
  });
});
