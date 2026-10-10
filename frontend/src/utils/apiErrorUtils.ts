// API ERROR UTILITIES
// Trích xuất message lỗi hiển thị được cho người dùng từ response lỗi của backend.
// Lý do tồn tại: `validate()` trả { message: 'Validation failed', errors: [{ field, message }] }.
// Nếu chỉ đọc `data.message` thì khách luôn chỉ thấy câu chung chung và không biết
// sai ở field nào. Các message ở đây đã có bản dịch trong `api_msg.*`.

export interface ApiFieldError {
  field?: string;
  message?: string;
}

export interface ApiErrorPayload {
  message?: string;
  error?: string;
  errors?: ApiFieldError[];
  /** Voucher trả riêng ngưỡng đơn tối thiểu để frontend dựng câu có số tiền */
  min_order_value?: number | string | null;
  [key: string]: unknown;
}

type TranslateApiMessage = (msg?: string | null) => string;
type TranslateWithFallback = (key: string, fallback?: string) => string;

/**
 * Message lỗi theo thứ tự ưu tiên: `errors[0].message` (lỗi field cụ thể, hữu ích nhất)
 * → `message` → `error` → `fallback`.
 *
 * @param payload   `error.response?.data`
 * @param translate `translateApiMessage` từ useLanguage()
 */
export function extractApiErrorMessage(
  payload: ApiErrorPayload | undefined | null,
  translate: TranslateApiMessage,
  fallback = ''
): string {
  const firstFieldError = payload?.errors?.[0]?.message;
  if (firstFieldError) {
    const translated = translate(firstFieldError);
    if (translated) return translated;
  }

  const message = translate(payload?.message);
  if (message) return message;

  const error = translate(payload?.error);
  if (error) return error;

  return fallback;
}

/**
 * Message "chưa đạt giá trị đơn tối thiểu" — backend trả riêng `min_order_value` (số)
 * nên frontend phải tự nội suy số tiền vào câu thông báo.
 * Trả `null` nếu response không phải lỗi ngưỡng, để caller xử lý tiếp.
 */
export function buildMinOrderValueMessage(
  payload: ApiErrorPayload | undefined | null,
  t: TranslateWithFallback,
  formatMoney: (value: number) => string
): string | null {
  if (payload?.min_order_value == null) return null;
  return t('api_msg.Minimum order value not met', 'Minimum order value of {min} not met').replace(
    '{min}',
    formatMoney(Number(payload.min_order_value))
  );
}
