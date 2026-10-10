import https from 'https';
import crypto from 'crypto';

export interface MomoPayResponse {
    partnerCode?: string;
    orderId?: string;
    requestId?: string;
    amount?: number;
    responseTime?: number;
    message?: string;
    resultCode?: number;
    payUrl?: string;
    deeplink?: string;
    qrCodeUrl?: string;
    errorCode?: number;
}
export interface MomoCallbackBody {
    partnerCode?: string;
    orderId?: string;
    requestId?: string;
    amount?: number;
    orderInfo?: string;
    orderType?: string;
    transId?: number;
    resultCode?: number;
    message?: string;
    payType?: string;
    responseTime?: number;
    extraData?: string;
    signature?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

/**
 * Generates a MoMo ATM/QR payment URL for redirection.
 */
export async function getMomoPayUrl(
    orderId: string,
    amountInput: number | string,
    orderInfo: string
): Promise<MomoPayResponse> {
    const partnerCode = process.env.MOMO_PARTNER_CODE || '';
    const accessKey = process.env.MOMO_ACCESS_KEY || '';
    const secretKey = process.env.MOMO_SECRET_KEY || '';

    const amountNumber = Math.round(Number(amountInput));
    const amountString = amountNumber.toString();
    const requestId = `${orderId}_${Date.now()}`;
    const momoOrderId = requestId;
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-return`;
    const baseUrl = process.env.BACKEND_URL?.replace(/\/+$/, '').replace(/\/api$/, '') || 'http://localhost:5000';
    const ipnUrl = `${baseUrl}/api/orders/momo-callback`;
    const requestType = "payWithATM";
    const extraData = "";

    const rawSignature = `accessKey=${accessKey}&amount=${amountString}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const requestBody = JSON.stringify({
        partnerCode,
        accessKey,
        requestId,
        amount: amountNumber,
        orderId: momoOrderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        extraData,
        requestType,
        signature,
        lang: 'en',
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'test-payment.momo.vn',
            port: 443,
            path: '/v2/gateway/api/create',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const parsed: unknown = JSON.parse(data);
                    if (isRecord(parsed)) {
                        resolve(parsed as MomoPayResponse);
                    } else {
                        resolve({ errorCode: -1, message: 'Invalid MoMo response payload' });
                    }
                } catch {
                    resolve({ errorCode: -1, message: "Error parsing MoMo response" });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(requestBody);
        req.end();
    });
}

/**
 * Verifies MoMo HMAC-SHA256 callback signature.
 */
export function verifyMomoSignature(body: unknown): boolean {
    if (!isRecord(body)) return false;

    const partnerCode = body.partnerCode;
    const orderId = body.orderId;
    const requestId = body.requestId;
    const amount = body.amount;
    const orderInfo = body.orderInfo;
    const orderType = body.orderType;
    const transId = body.transId;
    const resultCode = body.resultCode;
    const message = body.message;
    const payType = body.payType;
    const responseTime = body.responseTime;
    const extraData = body.extraData;
    const signature = body.signature;

    const accessKey = process.env.MOMO_ACCESS_KEY || '';
    const secretKey = process.env.MOMO_SECRET_KEY || '';

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const expectedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    if (typeof signature !== 'string' || !/^[a-f\d]{64}$/i.test(signature)) return false;
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
}
