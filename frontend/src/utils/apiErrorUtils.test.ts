import { describe, it, expect } from 'vitest';
import { translations } from '../locales/translations';
import { matchApiMessagePattern } from '../locales/apiMessagePatterns';
import { extractApiErrorMessage, type ApiErrorPayload } from './apiErrorUtils';

/**
 * Giả lập t() của LanguageContext: tra key trực tiếp, rồi tới `api_msg.<key>`
 * (xem LanguageContext.t — api message dùng key có tiền tố api_msg.)
 */
function makeTranslate(lang: 'vi' | 'en') {
  const dict = translations[lang] as unknown as Record<string, string>;
  return (key: string, fallback?: string): string =>
    dict[key] ?? dict[`api_msg.${key}`] ?? fallback ?? key;
}

const tVi = makeTranslate('vi');

/** translateApiMessage bản vi: key chính xác trước, rồi tới pattern động */
const translateVi = (msg?: string | null): string => {
  if (!msg) return '';
  const direct = tVi(msg);
  if (direct !== msg) return direct;
  return matchApiMessagePattern(msg, tVi) ?? msg;
};

describe('extractApiErrorMessage', () => {
  it('ưu tiên lỗi field cụ thể của middleware validate (và dịch sang tiếng Việt)', () => {
    const payload: ApiErrorPayload = {
      message: 'Validation failed',
      errors: [{ field: 'phone', message: 'Invalid phone number format' }],
    };

    // Không được trả câu chung "Dữ liệu không hợp lệ..." mà phải nêu rõ field
    expect(extractApiErrorMessage(payload, translateVi)).toBe('Số điện thoại không hợp lệ.');
  });

  it('dịch được lỗi voucher/order từ errors[] qua bảng api_msg.*', () => {
    expect(
      extractApiErrorMessage(
        {
          message: 'Validation failed',
          errors: [{ field: 'orderTotal', message: 'Invalid order total' }],
        },
        translateVi
      )
    ).toBe('Tổng tiền đơn hàng không hợp lệ.');

    expect(
      extractApiErrorMessage(
        {
          message: 'Validation failed',
          errors: [{ field: 'payment_method', message: 'Invalid option: expected one of "cod"|"momo"|"vnpay"' }],
        },
        translateVi,
        'fallback'
      )
    ).not.toBe('fallback');
  });

  it('rơi xuống message chung khi errors rỗng hoặc không có field message', () => {
    expect(
      extractApiErrorMessage({ message: 'Voucher has expired.', errors: [] }, translateVi)
    ).toBe('Voucher đã hết hạn.');

    expect(
      extractApiErrorMessage(
        { message: 'Voucher usage limit reached.', errors: [{ field: 'code' }] },
        translateVi
      )
    ).toBe('Voucher đã hết lượt sử dụng.');
  });

  it('dùng field `error` khi backend không trả `message`', () => {
    // backend có controller trả { error } thay vì { message } → vẫn phải dịch được
    expect(extractApiErrorMessage({ error: 'Server error applying voucher' }, translateVi)).toBe(
      'Lỗi máy chủ khi áp dụng voucher'
    );
    // message chưa có bản dịch → giữ nguyên gốc, không được nuốt thành chuỗi rỗng
    expect(extractApiErrorMessage({ error: 'Totally unknown backend error' }, translateVi)).toBe(
      'Totally unknown backend error'
    );
  });

  it('trả fallback khi payload rỗng/undefined (VD lỗi mạng)', () => {
    const fallback = 'Server connection error';
    expect(extractApiErrorMessage(undefined, translateVi, fallback)).toBe(fallback);
    expect(extractApiErrorMessage(null, translateVi, fallback)).toBe(fallback);
    expect(extractApiErrorMessage({}, translateVi, fallback)).toBe(fallback);
    expect(extractApiErrorMessage({ message: '' }, translateVi, fallback)).toBe(fallback);
  });

  it('giữ nguyên message động chưa có pattern nhưng không được nuốt lỗi', () => {
    const raw = 'Some brand new backend error';
    expect(extractApiErrorMessage({ message: raw }, translateVi)).toBe(raw);
  });
});
