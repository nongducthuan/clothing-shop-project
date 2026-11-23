import { getGatewayClientIp } from '../../utils/clientIp';

describe('getGatewayClientIp', () => {
  it('returns a plain address and strips the IPv4-mapped IPv6 prefix', () => {
    expect(getGatewayClientIp('203.0.113.7')).toBe('203.0.113.7');
    expect(getGatewayClientIp('::ffff:203.0.113.7')).toBe('203.0.113.7');
  });
  it('falls back to localhost when missing or IPv6 loopback', () => {
    expect(getGatewayClientIp(undefined)).toBe('127.0.0.1');
    expect(getGatewayClientIp('  ')).toBe('127.0.0.1');
    expect(getGatewayClientIp('::1')).toBe('127.0.0.1');
  });
});
