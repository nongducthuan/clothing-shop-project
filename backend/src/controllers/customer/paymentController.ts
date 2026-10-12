import { Request, Response } from 'express';
import type { OrderStatus } from '../../generated/prisma/client';
import prisma from '../../../prisma/client';
import { sendNotification } from '../../utils/socket';
import { changeOrderStatusLogicTx } from '../../services/orderStatusService';
import { generateVnPayUrl, verifyVnPayReturn } from '../../utils/vnpayService';
import { getMomoPayUrl, verifyMomoSignature } from '../../utils/momoService';
import { getErrorMessage } from '../../utils/errorMessage';

// Tên enum Prisma (Return_Approved, không phải "Return Approved").
const CLOSED_ORDER_STATUSES: OrderStatus[] = ['Cancelled', 'Return_Approved'];
// Mirror của canRepayOrder() ở frontend/src/utils/orderUtils.ts — sửa 1 nơi phải sửa cả 2.
const REPAYABLE_ORDER_STATUSES: OrderStatus[] = ['Pending', 'Confirmed'];

function getOrderIdFromPaymentReference(reference: unknown): number | null {
    if (typeof reference !== 'string' && typeof reference !== 'number') return null;
    const value = String(reference);
    const parts = value.split('_');
    const orderId = Number(value.startsWith('REPAY_') ? parts[1] : parts[0]);
    return Number.isSafeInteger(orderId) && orderId > 0 ? orderId : null;
}

function isExpectedPayment(order: { total_price: unknown }, method: string, amount: unknown): boolean {
    const receivedAmount = Number(amount);
    if (!Number.isFinite(receivedAmount)) return false;
    const expectedAmount = Math.round(Number(order.total_price) * (method === 'vnpay' ? 100 : 1));
    return Number.isFinite(expectedAmount) && receivedAmount === expectedAmount;
}

type PaymentSettlement = 'paid' | 'closed' | 'late' | 'not-found' | 'mismatch';

/** Apply a provider-confirmed payment atomically against cancellation/return status changes. */
async function settleSuccessfulPayment(
    orderId: number,
    method: 'momo' | 'vnpay',
    amount: unknown,
    providerReference: string,
): Promise<PaymentSettlement> {
    return prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: orderId } });
        if (!order) return 'not-found';
        if (!isExpectedPayment(order, method, amount)) return 'mismatch';

        const isClosed = (status: OrderStatus) => CLOSED_ORDER_STATUSES.includes(status);
        if (isClosed(order.status) || order.payment_status === 'Refunded') {
            // Never label a payment Refunded unless the provider refund actually happened.
            // Record the late successful provider notification for manual reconciliation.
            await tx.paymentStatusLog.create({
                data: {
                    order_id: orderId,
                    from_status: order.payment_status,
                    to_status: order.payment_status,
                    changed_by: null,
                    note: `Late ${method} success (${providerReference}); closed/refunded order requires reconciliation`.slice(0, 255),
                },
            });
            return 'closed';
        }

        if (order.payment_status === 'Paid') return 'paid'; // duplicate callback is idempotent

        // A provider may complete an old payment URL after the order entered Shipping,
        // Delivered, or a return flow. Do not mark it Paid: that could cause online + COD.
        // Persist an anomaly for the shop to reconcile/refund the real provider transaction.
        if (!REPAYABLE_ORDER_STATUSES.includes(order.status)) {
            await tx.paymentStatusLog.create({
                data: {
                    order_id: orderId,
                    from_status: order.payment_status,
                    to_status: order.payment_status,
                    changed_by: null,
                    note: `Late ${method} success (${providerReference}); order status ${order.status}; manual reconciliation required`.slice(0, 255),
                },
            });
            return 'late';
        }

        const update = await tx.order.updateMany({
            where: {
                id: orderId,
                payment_status: order.payment_status,
                status: { in: REPAYABLE_ORDER_STATUSES },
            },
            data: { payment_status: 'Paid', payment_method: method },
        });

        if (update.count !== 1) {
            const current = await tx.order.findUnique({ where: { id: orderId } });
            if (!current) return 'not-found';
            if (current.payment_status === 'Paid') return 'paid';
            if (CLOSED_ORDER_STATUSES.includes(current.status) || current.payment_status === 'Refunded') return 'closed';
            if (!REPAYABLE_ORDER_STATUSES.includes(current.status)) {
                await tx.paymentStatusLog.create({
                    data: {
                        order_id: orderId,
                        from_status: current.payment_status,
                        to_status: current.payment_status,
                        changed_by: null,
                        note: `Late ${method} success (${providerReference}); order status ${current.status}; manual reconciliation required`.slice(0, 255),
                    },
                });
                return 'late';
            }
            return 'mismatch';
        }

        const current = await tx.order.findUnique({ where: { id: orderId } });
        if (!current) return 'not-found';
        if (current.status === 'Pending') await changeOrderStatusLogicTx(tx, orderId, 'Confirmed');
        return 'paid';
    });
}

// Verify HMAC signature từ MoMo trước khi xử lý
export const momoCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId, resultCode } = req.body;
        const isValid = verifyMomoSignature(req.body);

        if (!isValid) {
            console.warn(`MoMo IPN: Invalid signature for orderId=${orderId}`);
            res.status(400).json({ message: "Invalid signature" });
            return;
        }

        const realOrderId = getOrderIdFromPaymentReference(orderId);
        if (!realOrderId) {
            res.status(400).json({ message: 'Invalid payment order reference' });
            return;
        }

        if (resultCode === 0) {
            const settlement = await settleSuccessfulPayment(realOrderId, 'momo', req.body.amount, String(orderId));
            if (settlement === 'not-found' || settlement === 'mismatch') {
                console.warn(`MoMo IPN: order or amount mismatch for orderId=${orderId}`);
                res.status(400).json({ message: 'Order or amount mismatch' });
                return;
            }

            if (settlement === 'closed' || settlement === 'late') {
                console.warn(`MoMo IPN: late payment for order #${realOrderId}; reconciliation required (${settlement}).`);
            } else {
                // Emit realtime socket event to Admin
                try {
                    await sendNotification(prisma, null, 'Thanh toán thành công', `Đơn hàng #${realOrderId} đã thanh toán qua MoMo`, 'Payment Successful', `Order #${realOrderId} has been paid via MoMo`, 'payment_success', { orderId: realOrderId, amount: req.body.amount, method: 'MoMo' });
                } catch (e) {
                    console.error('Socket emit error (MoMo IPN payment_success):', e);
                }
            }
        }
        res.status(204).send();
    } catch (error: unknown) {
        console.error("FULL IPN ERROR LOG:", error);
        res.status(500).json({ message: "IPN Webhook Error", error: getErrorMessage(error) });
    }
};

export const momoReturn = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = req.query;
        const { orderId, resultCode } = query;

        if (!orderId) {
            res.status(400).json({ success: false, message: "Missing orderId in query" });
            return;
        }

        const isValid = verifyMomoSignature(query);
        if (!isValid) {
            console.warn(`MoMo Return: Invalid signature for orderId=${orderId}`);
            res.status(400).json({ success: false, message: "Invalid signature" });
            return;
        }

        const realOrderId = getOrderIdFromPaymentReference(orderId);
        if (!realOrderId) {
            res.status(400).json({ success: false, message: 'Invalid payment order reference' });
            return;
        }

        if (String(resultCode) === '0') {
            const settlement = await settleSuccessfulPayment(realOrderId, 'momo', query.amount, String(orderId));
            if (settlement === 'not-found' || settlement === 'mismatch') {
                res.status(400).json({ success: false, message: 'Order or amount mismatch' });
                return;
            }

            if (settlement === 'closed' || settlement === 'late') {
                res.status(200).json({
                    success: false,
                    orderId: realOrderId,
                    message: "Payment arrived after the order became ineligible. The shop must reconcile the transaction and refund it if appropriate."
                });
                return;
            }

            res.status(200).json({
                success: true,
                orderId: realOrderId,
                message: "MoMo payment successful!"
            });
        } else {
            const order = await prisma.order.findUnique({ where: { id: realOrderId } });
            res.status(200).json({
                success: false,
                orderId: realOrderId,
                payment_method: order?.payment_method || 'momo',
                total_price: order?.total_price ?? 0,
                message: (query.message as string) || "MoMo payment was cancelled or failed."
            });
        }
    } catch (error: unknown) {
        console.error("MOMO RETURN ERROR:", error);
        res.status(500).json({ success: false, message: "Error verifying MoMo transaction" });
    }
};

export const vnpayIpn = async (req: Request, res: Response): Promise<void> => {
    try {
        const vnpParams = req.query;
        const verifyResult = verifyVnPayReturn(vnpParams);

        if (!verifyResult.isValidSignature) {
            console.warn(`VNPay IPN: Invalid signature for TxnRef=${verifyResult.vnp_TxnRef}`);
            res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' });
            return;
        }

        const realOrderId = getOrderIdFromPaymentReference(verifyResult.vnp_TxnRef);
        if (!realOrderId) {
            res.status(200).json({ RspCode: '01', Message: 'Invalid order reference' });
            return;
        }

        // VNPay sends IPN for failed transactions too. A failed payment must not
        // change payment_status, including on orders that have already been cancelled.
        if (verifyResult.responseCode !== '00') {
            res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
            return;
        }

        const settlement = await settleSuccessfulPayment(realOrderId, 'vnpay', verifyResult.amount, String(verifyResult.vnp_TxnRef));
        if (settlement === 'not-found') {
            res.status(200).json({ RspCode: '01', Message: 'Order not found' });
            return;
        }
        if (settlement === 'mismatch') {
            res.status(200).json({ RspCode: '04', Message: 'Order or amount mismatch' });
            return;
        }
        if (settlement === 'closed' || settlement === 'late') {
            // Acknowledge the provider callback after persisting the anomaly, to avoid
            // endless retries. This is NOT an automatic refund; the shop must reconcile it.
            res.status(200).json({ RspCode: '00', Message: 'Callback recorded; manual reconciliation required' });
            return;
        }

        try {
            await sendNotification(prisma, null, 'Thanh toán thành công', `Đơn hàng #${realOrderId} đã thanh toán qua VNPay`, 'Payment Successful', `Order #${realOrderId} has been paid via VNPay`, 'payment_success', { orderId: realOrderId, amount: verifyResult.amount, method: 'VNPay' });
        } catch (e) {
            console.error('Socket emit error (VNPay IPN payment_success):', e);
        }

        res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    } catch (error: unknown) {
        console.error("FULL VNPAY IPN ERROR LOG:", error);
        res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};

export const vnpayReturn = async (req: Request, res: Response): Promise<void> => {
    try {
        const vnpParams = req.query;
        const verifyResult = verifyVnPayReturn(vnpParams);

        if (!verifyResult.isValidSignature) {
            res.status(400).json({ success: false, message: "Invalid signature" });
            return;
        }

        const realOrderId = getOrderIdFromPaymentReference(verifyResult.vnp_TxnRef);
        if (!realOrderId) {
            res.status(400).json({ success: false, message: 'Invalid payment order reference' });
            return;
        }

        if (verifyResult.responseCode === '00') {
            const settlement = await settleSuccessfulPayment(realOrderId, 'vnpay', verifyResult.amount, String(verifyResult.vnp_TxnRef));
            if (settlement === 'not-found' || settlement === 'mismatch') {
                res.status(settlement === 'not-found' ? 404 : 400).json({
                    success: false,
                    message: settlement === 'not-found' ? 'Order not found' : 'Order or amount mismatch',
                });
                return;
            }
            if (settlement === 'closed' || settlement === 'late') {
                res.json({
                    success: false,
                    orderId: realOrderId,
                    message: "Payment arrived after the order became ineligible. The shop must reconcile the transaction and refund it if appropriate."
                });
                return;
            }
            res.json({ success: true, orderId: realOrderId, message: "Payment successful" });
        } else {
            const order = await prisma.order.findUnique({ where: { id: realOrderId } });
            res.json({
                success: false,
                orderId: realOrderId,
                payment_method: order?.payment_method || 'vnpay',
                total_price: order?.total_price ?? 0,
                message: "Payment failed or cancelled",
                responseCode: verifyResult.responseCode
            });
        }
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: getErrorMessage(error) });
    }
};

export const repayMoMoController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { new_payment_method } = req.body;

        const order = await prisma.order.findUnique({ where: { id: Number(id) } });
        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }

        // Kiểm tra ownership đúng cách (Cho phép Admin bypass)
        const isAdmin = req.user?.role === 'admin';
        if (order.user_id) {
            if (!isAdmin && (!req.user || req.user.id !== order.user_id)) {
                res.status(403).json({ message: "Forbidden: You do not have permission to pay for this order." });
                return;
            }
        } else {
            if (!isAdmin && (!req.guestOrderEmail || order.email.toLowerCase() !== req.guestOrderEmail)) {
                res.status(403).json({ message: "Forbidden: Verify the guest order by OTP before paying." });
                return;
            }
        }

        if (order.payment_status === 'Paid') {
            res.status(400).json({ message: "This order is already paid." });
            return;
        }

        if (CLOSED_ORDER_STATUSES.includes(order.status)) {
            res.status(400).json({ message: "Cannot change payment method or pay for a closed order." });
            return;
        }

        // Chỉ cho thanh toán lại / đổi phương thức khi đơn còn đang chờ xử lý. Đơn đã giao
        // cho shipper (Shipping), đã giao xong (Delivered) hoặc đang trong luồng đổi trả
        // thì không thể trả online nữa — tránh khách trả 2 lần (online + COD với shipper).
        if (!REPAYABLE_ORDER_STATUSES.includes(order.status)) {
            res.status(400).json({ message: "Payment can only be changed or retried while the order is Pending or Confirmed." });
            return;
        }

        const targetMethod = (new_payment_method || order.payment_method).toLowerCase();
        const allowedMethods = ['momo', 'vnpay', 'cod'];
        if (!allowedMethods.includes(targetMethod)) {
            res.status(400).json({ message: "Invalid payment method selected." });
            return;
        }

        // Cập nhật phương thức thanh toán mới nếu có sự thay đổi
        if (targetMethod !== order.payment_method) {
            await prisma.order.update({
                where: { id: order.id },
                data: { payment_method: targetMethod }
            });
        }

        if (targetMethod === 'momo') {
            const momoOrderId = `REPAY_${order.id}_${Date.now()}`;
            const momoResponse = await getMomoPayUrl(momoOrderId, Number(order.total_price), `Retry payment for order #${order.id}`);
            res.json({ payUrl: momoResponse.payUrl, payment_method: 'momo' });
            return;
        }

        if (targetMethod === 'vnpay') {
            const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
            const vnpayUrl = generateVnPayUrl({
                orderId: `${order.id}_${Date.now()}`,
                amount: Number(order.total_price),
                orderInfo: `Retry payment for order #${order.id}`,
                ipAddr: clientIp,
                bankCode: 'VNBANK',
            });
            res.json({ payUrl: vnpayUrl, payment_method: 'vnpay' });
            return;
        }

        if (targetMethod === 'cod') {
            res.json({
                message: "Switched to Cash on Delivery (COD) successfully.",
                payUrl: null,
                payment_method: 'cod'
            });
            return;
        }

        res.status(400).json({ message: "Repayment is not supported for this payment method." });
    } catch (error) {
        console.error("REPAY_ERROR:", error);
        res.status(500).json({ message: "Internal Server Error during repayment" });
    }
};
