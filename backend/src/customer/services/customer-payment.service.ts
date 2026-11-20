import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { OrderStatus, PaymentStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { changeOrderStatusLogicTx } from '../../services/orderStatusService';
import { generateVnPayUrl, verifyVnPayReturn } from '../../utils/vnpayService';
import { getMomoPayUrl, verifyMomoSignature } from '../../utils/momoService';
import { SocketService } from '../../socket/socket.service';
import { getErrorMessage } from '../../utils/errorMessage';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

const CLOSED_ORDER_STATUSES: OrderStatus[] = ['Cancelled', 'Return_Approved'];
const REPAYABLE_ORDER_STATUSES: OrderStatus[] = ['Pending', 'Confirmed'];
type PaymentSettlement = 'paid' | 'closed' | 'late' | 'not-found' | 'mismatch';
type PaymentReference = string | number | undefined;

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

@Injectable()
export class CustomerPaymentService {
  constructor(private readonly prisma: PrismaService, private readonly socketService: SocketService) {}

  private async settleSuccessfulPayment(orderId: number, method: 'momo' | 'vnpay', amount: unknown, providerReference: string): Promise<PaymentSettlement> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) return 'not-found';
      if (!isExpectedPayment(order, method, amount)) return 'mismatch';
      if (CLOSED_ORDER_STATUSES.includes(order.status) || order.payment_status === 'Refunded') {
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
      if (order.payment_status === 'Paid') return 'paid';
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
        where: { id: orderId, payment_status: order.payment_status, status: { in: REPAYABLE_ORDER_STATUSES } },
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

  async momoCallback(body: Record<string, unknown>) {
    try {
      const { orderId, resultCode } = body;
      if (!verifyMomoSignature(body)) throw new BadRequestException({ message: 'Invalid signature' });
      const realOrderId = getOrderIdFromPaymentReference(orderId);
      if (!realOrderId) throw new BadRequestException({ message: 'Invalid payment order reference' });
      if (resultCode === 0 || resultCode === '0') {
        const settlement = await this.settleSuccessfulPayment(realOrderId, 'momo', body.amount, String(orderId));
        if (settlement === 'not-found' || settlement === 'mismatch') throw new BadRequestException({ message: 'Order or amount mismatch' });
        if (settlement === 'closed' || settlement === 'late') {
          console.warn(`MoMo IPN: late payment for order #${realOrderId}; reconciliation required (${settlement}).`);
        } else {
          await this.socketService.sendNotification(null, 'Thanh toán thành công', `Đơn hàng #${realOrderId} đã thanh toán qua MoMo`, 'Payment Successful', `Order #${realOrderId} has been paid via MoMo`, 'payment_success', { orderId: realOrderId, amount: body.amount, method: 'MoMo' });
        }
      }
      return undefined; // The controller responds with HTTP 204.
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('FULL IPN ERROR LOG:', error);
      throw new InternalServerErrorException({ message: 'IPN Webhook Error', error: getErrorMessage(error) });
    }
  }

  async momoReturn(query: Record<string, unknown>) {
    try {
      const { orderId, resultCode } = query;
      if (!orderId) throw new BadRequestException({ success: false, message: 'Missing orderId in query' });
      if (!verifyMomoSignature(query)) throw new BadRequestException({ success: false, message: 'Invalid signature' });
      const realOrderId = getOrderIdFromPaymentReference(orderId);
      if (!realOrderId) throw new BadRequestException({ success: false, message: 'Invalid payment order reference' });
      if (String(resultCode) === '0') {
        const settlement = await this.settleSuccessfulPayment(realOrderId, 'momo', query.amount, String(orderId));
        if (settlement === 'not-found' || settlement === 'mismatch') throw new BadRequestException({ success: false, message: 'Order or amount mismatch' });
        if (settlement === 'closed' || settlement === 'late') {
          return { success: false, orderId: realOrderId, message: 'Payment arrived after the order became ineligible. The shop must reconcile the transaction and refund it if appropriate.' };
        }
        const order = await this.prisma.order.findUnique({ where: { id: realOrderId } });
        return { success: true, orderId: realOrderId, payment_method: 'momo', total_price: Number(order?.total_price ?? 0), message: 'MoMo payment successful!' };
      }
      const order = await this.prisma.order.findUnique({ where: { id: realOrderId } });
      return { success: false, orderId: realOrderId, payment_method: order?.payment_method || 'momo', total_price: order?.total_price ?? 0, message: String(query.message || 'MoMo payment was cancelled or failed.') };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('MOMO RETURN ERROR:', error);
      throw new InternalServerErrorException({ success: false, message: 'Error verifying MoMo transaction' });
    }
  }

  async vnpayIpn(query: Record<string, unknown>) {
    try {
      const verifyResult = verifyVnPayReturn(query);
      if (!verifyResult.isValidSignature) return { RspCode: '97', Message: 'Invalid Checksum' };
      const realOrderId = getOrderIdFromPaymentReference(verifyResult.vnp_TxnRef);
      if (!realOrderId) return { RspCode: '01', Message: 'Invalid order reference' };
      if (verifyResult.responseCode !== '00') return { RspCode: '00', Message: 'Confirm Success' };
      const settlement = await this.settleSuccessfulPayment(realOrderId, 'vnpay', verifyResult.amount, String(verifyResult.vnp_TxnRef));
      if (settlement === 'not-found') return { RspCode: '01', Message: 'Order not found' };
      if (settlement === 'mismatch') return { RspCode: '04', Message: 'Order or amount mismatch' };
      if (settlement === 'closed' || settlement === 'late') return { RspCode: '00', Message: 'Callback recorded; manual reconciliation required' };
      await this.socketService.sendNotification(null, 'Thanh toán thành công', `Đơn hàng #${realOrderId} đã thanh toán qua VNPay`, 'Payment Successful', `Order #${realOrderId} has been paid via VNPay`, 'payment_success', { orderId: realOrderId, amount: verifyResult.amount, method: 'VNPay' });
      return { RspCode: '00', Message: 'Confirm Success' };
    } catch (error) {
      console.error('FULL VNPAY IPN ERROR LOG:', error);
      return { RspCode: '99', Message: 'Unknown error' };
    }
  }

  async vnpayReturn(query: Record<string, unknown>) {
    try {
      const verifyResult = verifyVnPayReturn(query);
      if (!verifyResult.isValidSignature) throw new BadRequestException({ success: false, message: 'Invalid signature' });
      const realOrderId = getOrderIdFromPaymentReference(verifyResult.vnp_TxnRef);
      if (!realOrderId) throw new BadRequestException({ success: false, message: 'Invalid payment order reference' });
      if (verifyResult.responseCode === '00') {
        const settlement = await this.settleSuccessfulPayment(realOrderId, 'vnpay', verifyResult.amount, String(verifyResult.vnp_TxnRef));
        if (settlement === 'not-found') throw new NotFoundException({ success: false, message: 'Order not found' });
        if (settlement === 'mismatch') throw new BadRequestException({ success: false, message: 'Order or amount mismatch' });
        if (settlement === 'closed' || settlement === 'late') return { success: false, orderId: realOrderId, message: 'Payment arrived after the order became ineligible. The shop must reconcile the transaction and refund it if appropriate.' };
        const order = await this.prisma.order.findUnique({ where: { id: realOrderId } });
        return { success: true, orderId: realOrderId, payment_method: 'vnpay', total_price: Number(order?.total_price ?? 0), message: 'Payment successful' };
      }
      const order = await this.prisma.order.findUnique({ where: { id: realOrderId } });
      return { success: false, orderId: realOrderId, payment_method: order?.payment_method || 'vnpay', total_price: order?.total_price ?? 0, message: 'Payment failed or cancelled', responseCode: verifyResult.responseCode };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException({ success: false, message: getErrorMessage(error) });
    }
  }

  async repayMoMo(
    id: string,
    body: { new_payment_method?: string },
    user?: JwtPayload,
    guestOrderEmail?: string,
    forwardedFor?: string,
    remoteAddress?: string,
  ) {
    try {
      const order = await this.prisma.order.findUnique({ where: { id: Number(id) } });
      if (!order) throw new NotFoundException({ message: 'Order not found' });
      const isAdmin = user?.role === 'admin';
      if (order.user_id) {
        if (!isAdmin && (!user || user.id !== order.user_id)) throw new ForbiddenException({ message: 'Forbidden: You do not have permission to pay for this order.' });
      } else if (!isAdmin && (!guestOrderEmail || order.email.toLowerCase() !== guestOrderEmail)) {
        throw new ForbiddenException({ message: 'Forbidden: Verify the guest order by OTP before paying.' });
      }
      if (order.payment_status === 'Paid') throw new BadRequestException({ message: 'This order is already paid.' });
      if (CLOSED_ORDER_STATUSES.includes(order.status)) throw new BadRequestException({ message: 'Cannot change payment method or pay for a closed order.' });
      if (!REPAYABLE_ORDER_STATUSES.includes(order.status)) throw new BadRequestException({ message: 'Payment can only be changed or retried while the order is Pending or Confirmed.' });
      const targetMethod = String(body.new_payment_method || order.payment_method).toLowerCase();
      if (!['momo', 'vnpay', 'cod'].includes(targetMethod)) throw new BadRequestException({ message: 'Invalid payment method selected.' });
      if (targetMethod !== order.payment_method) await this.prisma.order.update({ where: { id: order.id }, data: { payment_method: targetMethod as 'momo' | 'vnpay' | 'cod' } });
      if (targetMethod === 'momo') {
        const momoOrderId = `REPAY_${order.id}_${Date.now()}`;
        const momoResponse = await getMomoPayUrl(momoOrderId, Number(order.total_price), `Retry payment for order #${order.id}`);
        return { payUrl: momoResponse.payUrl, payment_method: 'momo' };
      }
      if (targetMethod === 'vnpay') {
        const clientIp = forwardedFor || remoteAddress || '127.0.0.1';
        const vnpayUrl = generateVnPayUrl({ orderId: `${order.id}_${Date.now()}`, amount: Number(order.total_price), orderInfo: `Retry payment for order #${order.id}`, ipAddr: clientIp, bankCode: 'VNBANK' });
        return { payUrl: vnpayUrl, payment_method: 'vnpay' };
      }
      if (targetMethod === 'cod') return { message: 'Switched to Cash on Delivery (COD) successfully.', payUrl: null, payment_method: 'cod' };
      throw new BadRequestException({ message: 'Repayment is not supported for this payment method.' });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) throw error;
      console.error('REPAY_ERROR:', error);
      throw new InternalServerErrorException({ message: 'Internal Server Error during repayment' });
    }
  }
}
