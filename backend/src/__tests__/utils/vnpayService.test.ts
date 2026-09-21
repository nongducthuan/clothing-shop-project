import crypto from 'crypto';
import qs from 'qs';
import {
  sortObject,
  verifyVnPayReturn,
  generateVnPayUrl,
} from '../../utils/vnpayService';

describe('sortObject', () => {
  it('should sort keys alphabetically', () => {
    const input = { z_key: 'last', a_key: 'first', m_key: 'middle' };
    const result = sortObject(input);
    const keys = Object.keys(result);
    expect(keys).toEqual(['a_key', 'm_key', 'z_key']);
  });

  it('should encode special characters — values should not contain raw spaces', () => {
    const input = { vnp_OrderInfo: 'hello world' };
    const result = sortObject(input);
    // After encodeURIComponent + %20→+, spaces become "+"
    expect(result['vnp_OrderInfo']).not.toContain(' ');
  });

  it('should return empty object when given empty object', () => {
    expect(sortObject({})).toEqual({});
  });

  it('should handle numeric values — convert to encoded string', () => {
    const input = { vnp_Amount: 10000 };
    const result = sortObject(input);
    // encodeURIComponent(10000) → "10000" (no special chars)
    expect(result['vnp_Amount']).toBe('10000');
  });
});

/**
 * Helper: builds a VNPay callback params object and signs it correctly
 * using the SAME sortObject + qs.stringify logic as verifyVnPayReturn.
 */
function buildValidVnpParams(overrides: Record<string, any> = {}): Record<string, any> {
  const secretKey = process.env.VNP_HASHSECRET as string;

  // Raw params (unsorted, unsigned)
  const rawParams: Record<string, any> = {
    vnp_TxnRef: '1001',
    vnp_Amount: '20000000',
    vnp_BankCode: 'NCB',
    vnp_ResponseCode: '00',
    vnp_OrderInfo: 'Thanh toan don hang 1001',
    ...overrides,
  };

  // Sort using the SAME function that verifyVnPayReturn will use internally
  const sorted = sortObject(rawParams);
  const signData = qs.stringify(sorted, { encode: false });
  const signed = crypto
    .createHmac('sha512', secretKey)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  // Return the original (unsorted) params + the correct signature
  // verifyVnPayReturn will re-sort internally before verifying
  return { ...rawParams, vnp_SecureHash: signed };
}

describe('verifyVnPayReturn', () => {
  it('should return isSuccess=true and isValidSignature=true for valid params with responseCode 00', () => {
    const params = buildValidVnpParams();
    const result = verifyVnPayReturn(params);

    expect(result.isValidSignature).toBe(true);
    expect(result.isSuccess).toBe(true);
    expect(result.responseCode).toBe('00');
    expect(result.orderId).toBe('1001');
  });

  it('should return isSuccess=false when responseCode is not 00 (even with valid signature)', () => {
    // Build params signed with responseCode 24
    const params = buildValidVnpParams({ vnp_ResponseCode: '24' });
    const result = verifyVnPayReturn(params);

    expect(result.isValidSignature).toBe(true);
    expect(result.isSuccess).toBe(false);
    expect(result.responseCode).toBe('24');
  });

  it('should return isValidSignature=false when signature is tampered', () => {
    const params = buildValidVnpParams();
    params['vnp_SecureHash'] = 'totally_wrong_signature_abc123';

    const result = verifyVnPayReturn(params);

    expect(result.isValidSignature).toBe(false);
    expect(result.isSuccess).toBe(false);
  });

  it('should return isSuccess=false when amount is changed after signing (replay attack)', () => {
    const params = buildValidVnpParams({ vnp_Amount: '20000000' });
    // Attacker modifies amount AFTER signing
    params['vnp_Amount'] = '1';

    const result = verifyVnPayReturn(params);

    // Signature no longer matches the tampered amount
    expect(result.isValidSignature).toBe(false);
    expect(result.isSuccess).toBe(false);
  });
});

describe('generateVnPayUrl', () => {
  it('should return a URL string containing vnp_SecureHash', () => {
    const url = generateVnPayUrl({
      orderId: 999,
      amount: 150000,
      orderInfo: 'Test order 999',
    });

    expect(typeof url).toBe('string');
    expect(url).toContain('vnp_SecureHash=');
  });

  it('should include the base VNPay sandbox URL', () => {
    const url = generateVnPayUrl({
      orderId: 1,
      amount: 100000,
      orderInfo: 'Don hang 1',
    });

    expect(url).toContain('sandbox.vnpayment.vn');
  });

  it('should multiply amount by 100 as required by VNPay spec', () => {
    const url = generateVnPayUrl({
      orderId: 42,
      amount: 200000,
      orderInfo: 'order',
    });

    // vnp_Amount should be 200000 * 100 = 20000000
    expect(url).toContain('vnp_Amount=20000000');
  });

  it('should include bankCode in URL when provided', () => {
    const url = generateVnPayUrl({
      orderId: 7,
      amount: 50000,
      orderInfo: 'order with bank',
      bankCode: 'NCB',
    });

    expect(url).toContain('vnp_BankCode=NCB');
  });
});
