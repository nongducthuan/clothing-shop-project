import crypto from 'crypto';
import qs from 'qs';

type VnPaySortableValue = string | number | boolean | null | undefined;

function toVnPayString(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    throw new TypeError('VNPay parameters must contain only scalar values');
}

/**
 * Sorts object keys alphabetically and formats values according to VNPay guidelines.
 */
export function sortObject(obj: Record<string, VnPaySortableValue>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort((a, b) => encodeURIComponent(a).localeCompare(encodeURIComponent(b)));

    for (const key of keys) {
        sorted[encodeURIComponent(key)] = encodeURIComponent(toVnPayString(obj[key])).replace(/%20/g, '+');
    }

    return sorted;
}

/**
 * Formats a Date object into YYYYMMDDHHmmss format (GMT+7 for VNPay).
 */
function getVnPayDateFormat(date: Date): string {
    const gmt7Date = new Date(date.getTime() + (7 * 60 + date.getTimezoneOffset()) * 60000);
    const pad = (n: number) => (n < 10 ? '0' + n : n.toString());
    const year = gmt7Date.getFullYear();
    const month = pad(gmt7Date.getMonth() + 1);
    const day = pad(gmt7Date.getDate());
    const hours = pad(gmt7Date.getHours());
    const minutes = pad(gmt7Date.getMinutes());
    const seconds = pad(gmt7Date.getSeconds());
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export interface CreateVnPayUrlParams {
    orderId: string | number;
    amount: number;
    orderInfo: string;
    ipAddr?: string;
    bankCode?: string;
}

/**
 * Generates a signed VNPay payment URL for redirection.
 */
export function generateVnPayUrl(params: CreateVnPayUrlParams): string {
    const { tmnCode, secretKey, vnpUrl, returnUrl } = getVnPayConfig();

    const createDate = getVnPayDateFormat(new Date());

    let vnp_Params: Record<string, VnPaySortableValue> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: params.orderId.toString(),
        vnp_OrderInfo: params.orderInfo,
        vnp_OrderType: 'other',
        vnp_Amount: Math.round(params.amount * 100),
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: params.ipAddr || '127.0.0.1',
        vnp_CreateDate: createDate,
    };

    if (params.bankCode) {
        vnp_Params['vnp_BankCode'] = params.bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnp_Params['vnp_SecureHash'] = signed;
    return `${vnpUrl}?${qs.stringify(vnp_Params, { encode: false })}`;
}

export interface VerifyVnPayResult {
    isSuccess: boolean;
    isValidSignature: boolean;
    responseCode: string;
    orderId: string;
    vnp_TxnRef: string;
    amount: number;
}

function getVnPayConfig(): { tmnCode: string; secretKey: string; vnpUrl: string; returnUrl: string } {
    const tmnCode = process.env.VNP_TMNCODE?.trim();
    const secretKey = process.env.VNP_HASHSECRET?.trim();
    const vnpUrl = process.env.VNP_URL?.trim();
    const returnUrl = process.env.VNP_RETURNURL?.trim();
    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
        throw new Error('VNPay configuration is incomplete. Set VNP_TMNCODE, VNP_HASHSECRET, VNP_URL, and VNP_RETURNURL.');
    }
    return { tmnCode, secretKey, vnpUrl, returnUrl };
}

/**
 * Verifies HMAC-SHA512 checksum of VNPay response (IPN Webhook or Return URL).
 */
export function verifyVnPayReturn(vnpParamsInput: Record<string, unknown>): VerifyVnPayResult {
    const { secretKey } = getVnPayConfig();
    const vnpParams: Record<string, VnPaySortableValue> = {};
    for (const [key, value] of Object.entries(vnpParamsInput)) {
        if (
            value === null ||
            value === undefined ||
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
        ) {
            vnpParams[key] = value;
        } else if (Array.isArray(value)) {
            const first = value[0];
            if (first !== undefined && (typeof first === 'string' || typeof first === 'number' || typeof first === 'boolean')) {
                vnpParams[key] = first;
            }
        }
    }
    const secureHash = typeof vnpParams['vnp_SecureHash'] === 'string'
        ? vnpParams['vnp_SecureHash']
        : '';

    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    const sortedParams = sortObject(vnpParams);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const isValidSignature = /^[a-f\d]{128}$/i.test(secureHash) &&
        crypto.timingSafeEqual(Buffer.from(secureHash, 'hex'), Buffer.from(signed, 'hex'));
    const responseCode = toVnPayString(vnpParams['vnp_ResponseCode'] || '');
    const vnp_TxnRef = toVnPayString(vnpParams['vnp_TxnRef'] || '');
    const isSuccess = isValidSignature && responseCode === '00';

    return {
        isSuccess,
        isValidSignature,
        responseCode,
        orderId: vnp_TxnRef,
        vnp_TxnRef,
        amount: Number(vnpParams['vnp_Amount']),
    };
}
