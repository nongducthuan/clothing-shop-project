import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import type { PaymentMethod } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { allocateItemDiscounts } from '../../services/discountAllocationService';
import { MinimumOrderValueError, OrderCreationError, applyMembershipDiscount, applyVoucherDiscount, validateAndReserveItems } from '../../services/orderCreationService';
import { changeOrderStatusLogic } from '../../services/orderStatusService';
import { recordInteraction } from '../../services/interactionService';
import { queueEmail } from '../../utils/emailQueue';
import { SocketService } from '../../socket/socket.service';
import { toVnd } from '../../utils/pricing';
import { formatOrderResponse } from '../../utils/formatOrder';
import { generateVnPayUrl } from '../../payment/vnpay';
import { getMomoPayUrl } from '../../payment/momo';
import { calculateShippingFee, extractProvince } from '../../utils/shippingUtils';
import type { OrderRequestItem } from '../../types/orderTypes';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class StorefrontOrderService {
  constructor(private readonly prisma: PrismaService, private readonly socketService: SocketService) {}

  async createOrder(
    body: {
      address?: string; items?: OrderRequestItem[]; phone?: string; name?: string; email?: string;
      payment_method?: string; voucher_id?: string | number;
    },
    user?: JwtPayload,
    headers: { acceptLanguage?: string; language?: string; forwardedFor?: string; remoteAddress?: string } = {},
  ) {
    try {
      const userId = user?.id || null;
      const { address, items, phone, name, email, payment_method, voucher_id } = body;
      if (!address || !items || items.length === 0) throw new BadRequestException({ message: 'Invalid order data: Address or items are missing' });
      const orderEmail = email || user?.email || '';
      if (!orderEmail || typeof orderEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderEmail)) {
        throw new BadRequestException({ message: 'A valid email address is required to place an order.' });
      }
      const normalizedPaymentMethod = String(payment_method || 'cod').toLowerCase();
      const allowedPaymentMethods = new Set(['cod', 'momo', 'vnpay']);
      if (!allowedPaymentMethods.has(normalizedPaymentMethod)) {
        throw new BadRequestException({ message: 'Invalid payment method. Allowed values: cod, momo, vnpay.' });
      }

      let orderId = 0;
      let finalTotal = 0;
      await this.prisma.$transaction(async (tx) => {
        const { itemsToSave, serverCalculatedTotal, blockedProductIds } = await validateAndReserveItems(tx, items);
        const { totalMembershipDiscount, userMembershipPercent } = await applyMembershipDiscount(tx, userId, itemsToSave, blockedProductIds);
        finalTotal = Math.max(0, toVnd(serverCalculatedTotal - totalMembershipDiscount));
        const { totalVoucherDiscount, eligibleProductIds } = await applyVoucherDiscount(tx, voucher_id, itemsToSave, userMembershipPercent, blockedProductIds);
        finalTotal = Math.max(0, toVnd(finalTotal - totalVoucherDiscount));
        const itemAllocations = allocateItemDiscounts(itemsToSave, {
          membershipDiscount: totalMembershipDiscount,
          voucherDiscount: totalVoucherDiscount,
          eligibleProductIds,
          payableTotal: finalTotal,
        });
        itemsToSave.forEach((item, index) => {
          item.discount_amount = itemAllocations[index].discount_amount;
          item.payable_amount = itemAllocations[index].payable_amount;
        });
        const province = extractProvince(address);
        const totalQty = itemsToSave.filter((item) => !item.is_gift).reduce((sum, item) => sum + Number(item.quantity), 0);
        const serverShippingFee = calculateShippingFee(province, totalQty, finalTotal);
        if (serverShippingFee === null) throw new OrderCreationError(400, 'Unable to calculate shipping fee: province is missing.');
        finalTotal = Math.max(0, toVnd(finalTotal + serverShippingFee));
        const newOrder = await tx.order.create({
          data: {
            user_id: userId,
            voucher_id: voucher_id ? Number(voucher_id) : null,
            name: name || user?.name || 'Khách hàng',
            email: orderEmail,
            phone: phone || '',
            address,
            total_price: finalTotal,
            shipping_fee: serverShippingFee,
            membership_discount: totalMembershipDiscount,
            voucher_discount: totalVoucherDiscount,
            payment_method: normalizedPaymentMethod as PaymentMethod,
            items: { create: itemsToSave },
          },
        });
        orderId = newOrder.id;
      }, { maxWait: 10000, timeout: 30000 });

      let guestOrderAccessToken: string | undefined;
      if (!userId && process.env.JWT_SECRET) {
        guestOrderAccessToken = jwt.sign({ purpose: 'guest-order-access', email: orderEmail.toLowerCase() }, process.env.JWT_SECRET, { expiresIn: '2h' });
      }
      const lang = headers.acceptLanguage || headers.language || 'vi';
      const isEnglish = lang.startsWith('en');
      const emailLang = isEnglish ? 'en' : 'vi';
      queueEmail(
        orderEmail,
        isEnglish ? 'Order Confirmation' : 'Xác nhận đơn hàng',
        isEnglish
          ? `Thank you! Order #${orderId} has been placed successfully. Total: ${finalTotal.toLocaleString()} VND`
          : `Cảm ơn bạn! Đơn hàng #${orderId} đã được đặt thành công. Tổng cộng: ${finalTotal.toLocaleString()} VNĐ`,
        emailLang,
      );
      try {
        await this.socketService.sendNotification(null, 'Đơn hàng mới', `Khách hàng ${name} vừa đặt đơn hàng #${orderId}`, 'New Order', `Customer ${name} just placed order #${orderId}`, 'new_order', { orderId, total: finalTotal, customerName: name });
      } catch (error) {
        console.error('Socket emit error:', error);
      }
      if (userId) items.forEach((item) => void recordInteraction(userId, Number(item.product_id), 'purchase', this.prisma));

      if (normalizedPaymentMethod === 'momo') {
        try {
          const momoResponse = await getMomoPayUrl(orderId.toString(), finalTotal, `Payment for order #${orderId}`);
          if (!momoResponse?.payUrl) throw new Error(momoResponse?.message || 'Failed to get MoMo payUrl');
          return { message: 'Redirecting to MoMo', orderId, payUrl: momoResponse.payUrl, guestOrderAccessToken };
        } catch (error) {
          console.error('MoMo API Error:', error);
          return { message: 'Order created but MoMo payment link failed. Please retry payment in your profile.', orderId, payUrl: null, guestOrderAccessToken };
        }
      }
      if (normalizedPaymentMethod === 'vnpay') {
        try {
          const clientIp = headers.forwardedFor || headers.remoteAddress || '127.0.0.1';
          const vnpayUrl = generateVnPayUrl({ orderId: orderId.toString(), amount: finalTotal, orderInfo: `Thanh toan don hang #${orderId}`, ipAddr: clientIp, bankCode: 'VNBANK' });
          return { message: 'Redirecting to VNPay', orderId, payUrl: vnpayUrl, guestOrderAccessToken };
        } catch (error) {
          console.error('VNPay API Error:', error);
          return { message: 'Order created but VNPay payment link failed. Please retry payment in your profile.', orderId, payUrl: null, guestOrderAccessToken };
        }
      }
      return { message: 'Order placed successfully (COD)', orderId, total: finalTotal, payUrl: null, guestOrderAccessToken };
    } catch (error) {
      console.error('Order creation failed:', error instanceof Error ? error.message : String(error));
      if (error instanceof BadRequestException) throw error;
      if (error instanceof MinimumOrderValueError) throw new BadRequestException({ message: 'Minimum order value not met', min_order_value: error.min_order_value });
      if (error instanceof OrderCreationError) throw new HttpException({ message: error.message }, error.httpStatus);
      throw new InternalServerErrorException({ message: 'Failed to create order' });
    }
  }

  async getOrders(userId?: number) {
    if (!userId) throw new UnauthorizedException({ message: 'Unauthorized' });
    try {
      const orders = await this.prisma.order.findMany({
        where: { user_id: userId }, orderBy: { created_at: 'desc' },
        include: {
          return_request: { include: { items: { include: { order_item: { include: {
            product: { select: { name: true, name_vi: true, name_en: true, image_url: true } },
            color: { select: { color_name: true, color_name_vi: true, color_name_en: true, image_url: true } },
            size: { select: { size: true } },
          } } } } } },
          voucher: { select: { id: true, code: true, discount_percent: true, max_discount_amount: true } },
          items: { include: {
            promotion: { select: { id: true, buy_product_id: true, gift_product_id: true, buy_quantity: true, gift_quantity: true } },
            product: { select: { name: true, name_vi: true, name_en: true, image_url: true } },
            color: { select: { color_name: true, color_name_vi: true, color_name_en: true, image_url: true } },
            size: { select: { size: true } },
          } },
        },
      });
      return orders.map(formatOrderResponse);
    } catch (error) {
      console.error('Get orders error:', error);
      throw new InternalServerErrorException({ message: 'Error fetching order list' });
    }
  }

  async changeOrderStatus(
    body: { order_id?: string | number; new_status?: string },
    user?: JwtPayload,
    guestOrderEmail?: string,
  ) {
    try {
      const orderId = Number(body.order_id);
      const newStatus = body.new_status;
      const order = await this.prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException({ message: 'Order not found.' });
      const isAdmin = user?.role === 'admin';
      if (order.user_id) {
        if (!isAdmin && (!user || user.id !== order.user_id)) throw new ForbiddenException({ message: 'Forbidden: This order does not belong to you.' });
      } else if (!isAdmin && (!guestOrderEmail || order.email.toLowerCase() !== guestOrderEmail)) {
        throw new ForbiddenException({ message: 'Forbidden: Verify the guest order by OTP before changing it.' });
      }
      if (newStatus !== 'Cancelled') throw new ForbiddenException({ message: 'You are not allowed to set this order status.' });
      if (!['Pending', 'Confirmed'].includes(order.status)) throw new BadRequestException({ message: `Cannot cancel an order that is already "${order.status}".` });
      await changeOrderStatusLogic(orderId, newStatus, this.prisma);
      const updatedOrder = await this.prisma.order.findUnique({ where: { id: orderId }, select: { payment_status: true } });
      const finalPaymentStatus = updatedOrder?.payment_status ?? order.payment_status;
      try {
        await this.socketService.sendNotification(null, 'Đơn hàng bị hủy', `Đơn hàng #${orderId} đã bị hủy`, 'Order Cancelled', `Order #${orderId} has been cancelled`, 'order_cancelled', { orderId, customerName: order.name || `#${orderId}`, isPaid: order.payment_status === 'Paid' });
      } catch (error) {
        console.error('Socket emit error (order_cancelled):', error);
      }
      return { message: 'Order cancelled successfully!', payment_status: finalPaymentStatus };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) throw error;
      console.error('Order status update failed:', error);
      throw new InternalServerErrorException({ message: 'Failed to update order status', error: error instanceof Error ? error.message : String(error) });
    }
  }
}
