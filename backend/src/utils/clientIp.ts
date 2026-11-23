/**
 * IP to send to payment gateways. `ip` must come from Express' `req.ip` (the `@Ip()` decorator):
 * with `trust proxy` configured it is the real client address, unlike a raw
 * `X-Forwarded-For` header, which can hold several addresses and is client-controlled.
 */
export function getGatewayClientIp(ip?: string): string {
  const value = (ip ?? '').trim().replace(/^::ffff:/i, '');
  if (!value || value === '::1') return '127.0.0.1';
  return value;
}
