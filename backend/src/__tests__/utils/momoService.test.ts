import crypto from 'crypto';
import { verifyMomoSignature } from '../../utils/momoService';

/** Helper: build a valid MoMo callback body and sign it with the test secret */
function buildValidMomoBody(overrides: Record<string, any> = {}): Record<string, any> {
  const accessKey = process.env.MOMO_ACCESS_KEY as string;
  const secretKey = process.env.MOMO_SECRET_KEY as string;

  const base = {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    orderId: 'ORDER_1001_1700000000000',
    requestId: 'ORDER_1001_1700000000000',
    amount: 150000,
    orderInfo: 'Thanh toan don hang 1001',
    orderType: 'momo_wallet',
    transId: 9876543210,
    resultCode: 0,
    message: 'Successful.',
    payType: 'qr',
    responseTime: 1700000000000,
    extraData: '',
    ...overrides,
  };

  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${base.amount}` +
    `&extraData=${base.extraData}` +
    `&message=${base.message}` +
    `&orderId=${base.orderId}` +
    `&orderInfo=${base.orderInfo}` +
    `&orderType=${base.orderType}` +
    `&partnerCode=${base.partnerCode}` +
    `&payType=${base.payType}` +
    `&requestId=${base.requestId}` +
    `&responseTime=${base.responseTime}` +
    `&resultCode=${base.resultCode}` +
    `&transId=${base.transId}`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  return { ...base, signature };
}

describe('verifyMomoSignature', () => {
  it('should return true when signature matches (valid callback)', () => {
    const body = buildValidMomoBody();
    expect(verifyMomoSignature(body)).toBe(true);
  });

  it('should return false when signature is tampered', () => {
    const body = buildValidMomoBody();
    body.signature = 'tampered_invalid_signature_xyz';
    expect(verifyMomoSignature(body)).toBe(false);
  });

  it('should return false when amount is modified after signing', () => {
    const body = buildValidMomoBody();
    body.amount = 1; // attacker changes amount
    expect(verifyMomoSignature(body)).toBe(false);
  });

  it('should return false when resultCode is modified after signing (replay attack)', () => {
    // Build a body signed with resultCode=0 (failed payment)
    const body = buildValidMomoBody({ resultCode: 99 });
    // Attacker mutates resultCode to make it look like success
    body.resultCode = 0;
    // Signature no longer matches → should reject
    expect(verifyMomoSignature(body)).toBe(false);
  });

  it('should return true for different valid amounts', () => {
    const body = buildValidMomoBody({ amount: 500000 });
    expect(verifyMomoSignature(body)).toBe(true);
  });
});
