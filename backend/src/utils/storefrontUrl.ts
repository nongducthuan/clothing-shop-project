const DEFAULT_STOREFRONT_URL = 'http://localhost:5173';

const clean = (value: string | undefined): string =>
  (value ?? '').trim().replace(/\/+$/, '');

/**
 * URL gốc của storefront (nơi khách quay về sau thanh toán MoMo).
 *
 * `FRONTEND_URL` có thể chứa NHIỀU origin phân tách bằng dấu phẩy (storefront + admin) để
 * dùng cho CORS, nên không thể ghép thẳng vào link redirect. Thứ tự ưu tiên:
 * 1. `STOREFRONT_URL` (khuyến nghị khi deploy storefront và admin ở 2 domain)
 * 2. Phần tử đầu tiên của `FRONTEND_URL`
 * 3. `http://localhost:5173`
 */
export function getStorefrontUrl(env: NodeJS.ProcessEnv = process.env): string {
  const explicit = clean(env.STOREFRONT_URL);
  if (explicit) return explicit;

  const firstFrontendUrl = clean((env.FRONTEND_URL ?? '').split(',')[0]);
  return firstFrontendUrl || DEFAULT_STOREFRONT_URL;
}
