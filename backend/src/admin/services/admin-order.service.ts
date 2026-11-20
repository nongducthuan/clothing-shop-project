import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ENUM_TO_DISPLAY_STATUS } from '../../constants/orderStatus';
import { buildOrderFilter } from '../../services/orderFilterService';
import { confirmPaymentStatus, isOrderServiceError, updateOrderStatusByAdmin } from '../../services/orderStatusService';
import { SocketService } from '../../socket/socket.service';

@Injectable()
export class AdminOrderService {
  constructor(private readonly prisma: PrismaService, private readonly socketService: SocketService) {}

  async getOrders(query: { page?: string; limit?: string; tab?: string; status?: string }) {
    try {
      const p = Math.max(1, Number(query.page) || 1);
      const l = Math.min(100, Math.max(1, Number(query.limit) || 50));
      const offset = (p - 1) * l;
      const where = buildOrderFilter(query.tab, query.status);
      const [ordersRaw, totalOrders] = await Promise.all([
        this.prisma.order.findMany({
          where, skip: offset, take: l,
          include: {
            user: { select: { name: true, email: true } },
            voucher: { select: { id: true, code: true, discount_percent: true, max_discount_amount: true } },
            return_request: { include: { items: { include: { order_item: { include: {
              product: { select: { name: true, name_vi: true, name_en: true, image_url: true } },
              color: { select: { color_name: true, color_name_vi: true, color_name_en: true, image_url: true } },
              size: { select: { size: true } },
            } } } } } },
            items: { include: {
              product: { select: { name: true, name_vi: true, name_en: true, image_url: true } },
              color: { select: { color_name: true, color_name_vi: true, color_name_en: true, image_url: true } },
              size: { select: { size: true } },
            } },
          },
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.order.count({ where }),
      ]);

      const processedOrders = ordersRaw.map((order) => {
        let bankInfo: unknown = null;
        let returnImages: string[] = [];
        const rr = order.return_request;
        if (rr) {
          try {
            bankInfo = typeof rr.refund_bank_info === 'string' ? JSON.parse(rr.refund_bank_info) as unknown : rr.refund_bank_info;
            const parsed = typeof rr.images === 'string' ? JSON.parse(rr.images) as unknown : rr.images;
            returnImages = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
          } catch (error) {
            console.error('Error parsing return data for order:', order.id, error);
          }
        }
        const items = order.items.map((item) => ({
          ...item,
          product_name: item.product?.name,
          product_name_vi: item.product?.name_vi,
          product_name_en: item.product?.name_en,
          image_url: item.color?.image_url || item.product?.image_url,
          color_name: item.color?.color_name,
          color_name_vi: item.color?.color_name_vi,
          color_name_en: item.color?.color_name_en,
          size: item.size?.size,
        }));
        const displayStatus = ENUM_TO_DISPLAY_STATUS[order.status] || order.status;
        const normalizedDisplayStatus = displayStatus === 'Delivered' && rr?.status === 'Pending' ? 'Return Requested' : displayStatus;
        return {
          ...order,
          status: normalizedDisplayStatus,
          user_name: order.user?.name || order.name,
          user_email: order.user?.email || order.email,
          shipping_fee: Number(order.shipping_fee || 0),
          reason_code: rr?.reason_code,
          description: rr?.description,
          admin_response: rr?.admin_response,
          refund_bank_info: bankInfo,
          return_images: returnImages,
          return_status: rr?.status,
          refund_amount: rr ? Number(rr.refund_amount) : 0,
          return_items: rr?.items?.map((ri) => ({
            ...ri,
            unit_price: ri.order_item?.price != null ? Number(ri.order_item.price) : null,
            original_quantity: ri.order_item?.quantity ?? null,
            order_item: ri.order_item ? {
              ...ri.order_item,
              product_name: ri.order_item.product?.name,
              product_name_vi: ri.order_item.product?.name_vi,
              product_name_en: ri.order_item.product?.name_en,
              color_name: ri.order_item.color?.color_name,
              color_name_vi: ri.order_item.color?.color_name_vi,
              color_name_en: ri.order_item.color?.color_name_en,
              size: ri.order_item.size?.size,
            } : null,
          })) || [],
          voucher: order.voucher ? {
            id: order.voucher.id,
            code: order.voucher.code,
            discount_percent: order.voucher.discount_percent ? Number(order.voucher.discount_percent) : null,
            max_discount_amount: order.voucher.max_discount_amount ? Number(order.voucher.max_discount_amount) : null,
          } : null,
          voucher_code: order.voucher?.code || null,
          items,
          user: undefined,
          return_request: undefined,
        };
      });
      return { data: processedOrders, totalPages: Math.ceil(totalOrders / l), currentPage: p, totalOrders };
    } catch (error) {
      console.error('getOrders admin error:', error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async confirmPayment(orderId: string, paymentStatus: unknown, changedBy?: number) {
    try {
      await confirmPaymentStatus(Number(orderId), paymentStatus, changedBy ?? null, this.prisma);
      return { message: `Payment status updated to ${String(paymentStatus)}` };
    } catch (error) {
      if (isOrderServiceError(error)) throw new HttpException({ message: error.message }, error.httpStatus);
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error updating payment' });
    }
  }

  async updateOrderStatus(orderId: string, status: string) {
    try {
      const numericId = Number(orderId);
      const { userId } = await updateOrderStatusByAdmin(numericId, status, this.prisma);
      if (userId) {
        await this.socketService.sendNotification(
          userId,
          `Đơn hàng #${numericId} cập nhật`,
          `Trạng thái đơn hàng của bạn đã được chuyển thành: ${status}`,
          `Order #${numericId} updated`,
          `Your order status has been changed to: ${status}`,
          'customer_notification',
          { orderId: numericId, status },
        );
      }
      return { message: 'Order status updated successfully' };
    } catch (error) {
      if (isOrderServiceError(error)) throw new HttpException({ message: error.message }, error.httpStatus);
      console.error(error);
      throw new InternalServerErrorException({ message: error instanceof Error ? error.message : String(error) });
    }
  }
}
