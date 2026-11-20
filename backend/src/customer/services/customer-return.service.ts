import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { parseBankInfo, buildReturnPlan } from '../../services/returnRequestService';
import { isWithinReturnWindow, ReturnWindowExpiredError } from '../../constants/returnPolicy';
import { changeOrderStatusLogicTx } from '../../services/orderStatusService';
import { SocketService } from '../../socket/socket.service';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

export type PersistedReturnImage = { filename: string };

@Injectable()
export class CustomerReturnService {
  constructor(private readonly prisma: PrismaService, private readonly socketService: SocketService) {}

  async submitReturnRequest(
    orderIdValue: string,
    body: { reason_code?: string; description?: string; returnItems?: unknown; refund_bank_info?: unknown; bankInfo?: unknown },
    files: PersistedReturnImage[],
    user?: JwtPayload,
    guestOrderEmail?: string,
  ) {
    const orderId = Number(orderIdValue);
    if (!body.reason_code) throw new BadRequestException({ message: 'Return reason is required.' });
    try {
      let parsedReturnItems: { order_item_id: number; return_quantity: number }[] = [];
      if (body.returnItems) {
        try {
          parsedReturnItems = typeof body.returnItems === 'string'
            ? JSON.parse(body.returnItems) as { order_item_id: number; return_quantity: number }[]
            : body.returnItems as { order_item_id: number; return_quantity: number }[];
        } catch {
          throw new BadRequestException({ message: 'Invalid returnItems format.' });
        }
      }
      const finalBankInfo = parseBankInfo(body.refund_bank_info || body.bankInfo);
      const images = Array.isArray(files) ? files.map((file) => `/uploads/${file.filename}`) : [];

      await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
          where: { id: orderId, status: 'Delivered' },
          include: { items: { include: { promotion: true } } },
        });
        if (!order) throw new BadRequestException({ message: 'The order is invalid or not delivered.' });
        const isAdmin = user?.role === 'admin';
        if (order.user_id) {
          if (!isAdmin && (!user || user.id !== order.user_id)) throw new ForbiddenException({ message: 'Forbidden: This order belongs to another member.' });
        } else if (!isAdmin && (!guestOrderEmail || order.email.toLowerCase() !== guestOrderEmail)) {
          throw new ForbiddenException({ message: 'Forbidden: Verify the guest order by OTP before requesting a return.' });
        }
        if (!isAdmin && !isWithinReturnWindow(order)) throw new ReturnWindowExpiredError();
        const existing = await tx.returnRequest.findUnique({ where: { order_id: orderId } });
        if (existing) throw new BadRequestException({ message: 'A return request has already been submitted for this order.' });
        let returnPlan: ReturnType<typeof buildReturnPlan>;
        try {
          returnPlan = buildReturnPlan(order, parsedReturnItems);
        } catch (error) {
          throw new BadRequestException({ message: error instanceof Error ? error.message : String(error) });
        }
        await tx.returnRequest.create({
          data: {
            order_id: orderId,
            reason_code: body.reason_code,
            description: body.description || null,
            images: JSON.stringify(images),
            refund_bank_info: JSON.stringify(finalBankInfo),
            refund_amount: returnPlan.totalRefundAmount,
            status: 'Pending',
            items: { create: returnPlan.returnItemsToCreate },
          },
        });
        await tx.order.update({ where: { id: orderId }, data: { status: 'Return_Requested' } });
      });

      try {
        await this.socketService.sendNotification(null, 'Yêu cầu trả hàng', `Đơn hàng #${orderId} có yêu cầu trả hàng mới`, 'Return Request', `Order #${orderId} has a new return request`, 'new_return_request', { orderId, customerName: user?.email || guestOrderEmail || `Order #${orderId}` });
      } catch (error) {
        console.error('Socket emit return error:', error);
      }
      return { message: 'Return request submitted successfully' };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) throw error;
      if (error instanceof ReturnWindowExpiredError) throw new BadRequestException({ message: error.message });
      console.error('ERROR_SUBMIT_RETURN:', error);
      throw new InternalServerErrorException({ message: error instanceof Error ? error.message : String(error) });
    }
  }

  async cancelReturnRequest(orderIdValue: string, user?: JwtPayload, guestOrderEmail?: string) {
    const orderId = Number(orderIdValue);
    const verifiedEmail = guestOrderEmail || user?.email?.toLowerCase() || '';
    try {
      await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: orderId }, include: { return_request: true } });
        if (!order) throw new NotFoundException({ message: `Order #${orderId} not found.` });
        const isReturnRequested = ['Return_Requested', 'Return Requested'].includes(order.status as string);
        const isPendingRedo = order.status === 'Delivered' && order.return_request?.status === 'Pending';
        if (!isReturnRequested && !isPendingRedo) throw new BadRequestException({ message: `Order #${orderId} is not in Return Requested status (current status: '${order.status}').` });
        if (order.return_request && order.return_request.status !== 'Pending') throw new BadRequestException({ message: `Return request for order #${orderId} has already been ${order.return_request.status.toLowerCase()} and cannot be cancelled.` });
        const isAdmin = user?.role === 'admin';
        const matchesUserId = order.user_id && user?.id === order.user_id;
        const matchesEmail = verifiedEmail && order.email.toLowerCase() === verifiedEmail;
        if (!isAdmin && !matchesUserId && !matchesEmail) throw new ForbiddenException({ message: 'Forbidden: You do not have permission to cancel this return request.' });
        if (order.return_request) await tx.returnRequest.delete({ where: { order_id: orderId } });
        await changeOrderStatusLogicTx(tx, orderId, 'Delivered', { isUndo: true, skipFinancial: true, skipStock: true });
      });
      try {
        await this.socketService.sendNotification(null, 'Hủy yêu cầu trả hàng', `Yêu cầu trả hàng cho đơn #${orderId} đã bị hủy`, 'Return Request Cancelled', `Return request for order #${orderId} has been cancelled`, 'return_cancelled', { orderId });
      } catch (error) {
        console.error('Socket emit error (return_cancelled):', error);
      }
      return { message: 'Return request cancelled successfully.' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) throw error;
      console.error('ERROR_CANCEL_RETURN:', error);
      throw new InternalServerErrorException({ message: error instanceof Error ? error.message : String(error) });
    }
  }
}
