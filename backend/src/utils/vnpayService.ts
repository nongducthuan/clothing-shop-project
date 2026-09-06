import crypto from 'crypto';
import qs from 'qs';

/**
 * Sorts object keys alphabetically and formats values according to VNPay guidelines.
 */
export function sortObject(obj: Record<string, any>): Record<string, any> {
    const sorted: Record<string, any> = {};
    const str: string[] = [];
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (let key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
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
    const tmnCode = process.env.VNP_TMNCODE || '4HOT8UKN';
    const secretKey = process.env.VNP_HASHSECRET || 'CMWXUJBAIHSWVEVCSLLRRUPELLFFNRRU';
    let vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = process.env.VNP_RETURNURL || 'http://localhost:5173/payment-return';

    const createDate = getVnPayDateFormat(new Date());

    let vnp_Params: Record<string, any> = {
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
    vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

    return vnpUrl;
}

export interface VerifyVnPayResult {
    isSuccess: boolean;
    isValidSignature: boolean;
    responseCode: string;
    orderId: string;
    vnp_TxnRef: string;
}

/**
 * Verifies HMAC-SHA512 checksum of VNPay response (IPN Webhook or Return URL).
 */
export function verifyVnPayReturn(vnpParamsInput: Record<string, any>): VerifyVnPayResult {
    const secretKey = process.env.VNP_HASHSECRET || 'CMWXUJBAIHSWVEVCSLLRRUPELLFFNRRU';
    const vnpParams = { ...vnpParamsInput };
    const secureHash = vnpParams['vnp_SecureHash'];

    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    const sortedParams = sortObject(vnpParams);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const isValidSignature = secureHash === signed;
    const responseCode = (vnpParams['vnp_ResponseCode'] as string) || '';
    const vnp_TxnRef = (vnpParams['vnp_TxnRef'] as string) || '';
    const isSuccess = isValidSignature && responseCode === '00';

    return {
        isSuccess,
        isValidSignature,
        responseCode,
        orderId: vnp_TxnRef,
        vnp_TxnRef,
    };
}
