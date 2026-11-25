import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { STATUS_DISPLAY_TO_ENUM } from '../../constants/orderStatus';
import { changeOrderStatusLogicTx } from '../../services/orderStatusService';
import { SocketService } from '../../socket/socket.service';

@Injectable()
export class AdminReturnService {
  constructor(private readonly prisma: PrismaService, private readonly socketService: SocketService) {}

  async approveReturn(orderIdValue: string) {
    const orderId = Number(orderIdValue);
    try {
      let userIdToNotify: number | null = null;
      await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: orderId }, select: { status: true, user_id: true } });
        if (!order) throw new Error('Order not found.');
        const orderStatus = STATUS_DISPLAY_TO_ENUM[order.status as string] ?? order.status as string;
        if (!['Delivered', 'Return_Requested'].includes(orderStatus)) throw new Error('Only delivered orders with a pending return can be approved.');
        const returnReq = await tx.returnRequest.findUnique({ where: { order_id: orderId }, include: { items: { include: { order_item: true } } } });
        if (returnReq && returnReq.status !== 'Pending') throw new Error('Only a pending return request can be approved.');
        userIdToNotify = order.user_id;
        const refundAmount = returnReq ? Number(returnReq.refund_amount) : 0;
        const hasPartialItems = !!returnReq?.items && returnReq.items.length > 0;
        const shippingRefund = returnReq ? Number(returnReq.shipping_refund ?? 0) : 0;
        if (returnReq) {
          await tx.returnRequest.update({ where: { order_id: orderId }, data: { status: 'Approved', admin_response: null } });
        } else {
          await tx.returnRequest.create({ data: { order_id: orderId, reason_code: 'Admin Approval', description: 'Manually approved by admin', status: 'Approved', admin_response: null } });
        }
        if (hasPartialItems) {
          await changeOrderStatusLogicTx(tx, orderId, 'Return_Approved', {
            partial: {
              returnItems: returnReq!.items.map((item) => ({ size_id: item.order_item.size_id, return_quantity: item.return_quantity })),
              refundAmount: refundAmount + shippingRefund,
            },
          });
        } else {
          await changeOrderStatusLogicTx(tx, orderId, 'Return_Approved');
        }
      });
      if (userIdToNotify) {
        await this.socketService.sendNotification(userIdToNotify,
          `Yêu cầu trả hàng #${orderId} được duyệt`,
          'Yêu cầu trả hàng của bạn đã được admin duyệt thành công.',
          `Return request #${orderId} approved`,
          'Your return request has been successfully approved by admin.',
          'customer_notification', { orderId });
      }
      return { message: 'Return request approved successfully!' };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ message: error instanceof Error ? error.message : 'Server Error' });
    }
  }

  async undoApproveReturn(orderIdValue: string, body: { stock_returned?: boolean; money_refunded?: boolean }, adminId?: number) {
    const orderId = Number(orderIdValue);
    const { stock_returned = true, money_refunded = true } = body ?? {};
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
        if (!order) throw new Error('Order not found.');
        const oldEnum = STATUS_DISPLAY_TO_ENUM[order.status as string] ?? order.status as string;
        if (oldEnum !== 'Return_Approved') throw new Error(`Only a Return Approved order can be un-approved (current: "${order.status}").`);
        const returnReq = await tx.returnRequest.findUnique({
          where: { order_id: orderId },
          include: { items: { include: { order_item: true } }, order: { select: { user_id: true } } },
        });
        const hasPartialItems = !!returnReq?.items && returnReq.items.length > 0;
        const refundAmount = returnReq ? Number(returnReq.refund_amount) : 0;
        const shippingRefund = returnReq ? Number(returnReq.shipping_refund ?? 0) : 0;
        const restoreAmount = hasPartialItems ? refundAmount + shippingRefund : Number(order.total_price);

        if (!stock_returned) {
          const toDeduct: { size_id: number | null; qty: number }[] = hasPartialItems
            ? returnReq!.items.map((item) => ({ size_id: item.order_item.size_id, qty: item.return_quantity }))
            : order.items.map((item) => ({ size_id: item.size_id, qty: item.quantity }));
          for (const deduction of toDeduct) {
            if (!deduction.size_id) continue;
            const size = await tx.productSize.findUnique({ where: { id: deduction.size_id } });
            if (!size || Number(size.stock) < deduction.qty) throw new Error(`Insufficient stock for product (size_id=${deduction.size_id})`);
            await tx.productSize.update({ where: { id: deduction.size_id }, data: { stock: { decrement: deduction.qty } } });
          }
        }

        const revenueDate = order.delivered_at ? new Date(order.delivered_at) : new Date();
        revenueDate.setHours(0, 0, 0, 0);
        const revenuePayload: Prisma.RevenueUpdateInput = {
          total_sales: { increment: Math.max(0, restoreAmount) },
          ...(hasPartialItems ? {} : { total_orders: { increment: 1 } }),
        };
        const existingRevenue = await tx.revenue.findUnique({ where: { report_date: revenueDate } });
        if (existingRevenue) await tx.revenue.update({ where: { report_date: revenueDate }, data: revenuePayload });
        else await tx.revenue.create({ data: { report_date: revenueDate, total_sales: Math.max(0, restoreAmount), total_orders: hasPartialItems ? 0 : 1 } });

        if (order.user_id && restoreAmount > 0) {
          const currentUser = await tx.user.findUnique({ where: { id: order.user_id } });
          if (currentUser) {
            const newTotalSpent = Math.max(0, Number(currentUser.total_spent) + restoreAmount);
            await tx.user.update({ where: { id: order.user_id }, data: { total_spent: newTotalSpent } });
            const tier = await tx.membership.findFirst({ where: { min_spending: { lte: newTotalSpent }, is_active: true }, orderBy: { min_spending: 'desc' } });
            await tx.user.update({ where: { id: order.user_id }, data: { membership_id: tier?.id ?? null } });
          }
        }

        await changeOrderStatusLogicTx(tx, orderId, 'Return_Requested', { isUndo: true, skipFinancial: true, skipStock: true });
        if (returnReq) await tx.returnRequest.update({ where: { order_id: orderId }, data: { status: 'Pending', admin_response: null } });

        let paymentRestored = false;
        if (!money_refunded && order.payment_status === 'Refunded') {
          await tx.order.update({ where: { id: orderId }, data: { payment_status: 'Paid' } });
          await tx.paymentStatusLog.create({
            data: { order_id: orderId, from_status: 'Refunded', to_status: 'Paid', changed_by: adminId ?? null, note: 'Undo approve: money not yet refunded' },
          });
          paymentRestored = true;
        }
        return { restoreAmount, hasPartialItems, paymentRestored };
      });
      return { message: 'Return approval undone. Order is back to Return Requested.', ...result };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ message: error instanceof Error ? error.message : 'Server Error' });
    }
  }

  async rejectReturn(orderIdValue: string, adminNote?: string) {
    const orderId = Number(orderIdValue);
    try {
      await this.prisma.$transaction(async (tx) => {
        const current = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
        if (!current) throw new Error('Order not found.');
        const currentEnum = STATUS_DISPLAY_TO_ENUM[current.status as string] ?? current.status as string;
        const rejectFromDelivered = currentEnum === 'Delivered';
        if (!rejectFromDelivered && currentEnum !== 'Return_Requested') throw new Error('Only delivered orders with a pending return can be rejected.');
        const existing = await tx.returnRequest.findUnique({ where: { order_id: orderId } });
        if (existing && existing.status !== 'Pending') throw new Error('Only a pending return request can be rejected.');
        if (existing) {
          await tx.returnRequest.update({ where: { order_id: orderId }, data: { status: 'Rejected', admin_response: adminNote } });
        } else {
          await tx.returnRequest.create({ data: { order_id: orderId, reason_code: 'Admin Rejection', description: 'Manually rejected by admin', status: 'Rejected', admin_response: adminNote || 'Rejected by admin' } });
        }
        await changeOrderStatusLogicTx(tx, orderId, 'Return_Rejected', rejectFromDelivered ? { skipFinancial: true } : undefined);
      });
      return { message: 'Return request rejected successfully.' };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ message: 'Failed to reject return request', error: error instanceof Error ? error.message : String(error) });
    }
  }
}
