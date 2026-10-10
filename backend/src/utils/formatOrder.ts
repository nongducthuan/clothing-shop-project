import type { FormattableOrder } from '../types/orderTypes';
import { ENUM_TO_DISPLAY_STATUS } from '../constants/orderStatus';
import { getReturnDeadline, isWithinReturnWindow } from '../constants/returnPolicy';

/** Chuyển đổi Prisma order row → response shape dùng chung cho getOrders và verifyOtpAndGetOrders. */
export function formatOrderResponse(order: FormattableOrder) {
    return {
        id: order.id,
        email: order.email,
        name: order.name,
        phone: order.phone,
        address: order.address,
        total_price: Number(order.total_price),
        shipping_fee: Number(order.shipping_fee || 0),
        membership_discount: Number(order.membership_discount || 0),
        voucher_discount: Number(order.voucher_discount || 0),
        status: ENUM_TO_DISPLAY_STATUS[order.status] || order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        created_at: order.created_at,
        delivered_at: order.delivered_at,
        // Quy tắc đổi trả 7 ngày tính ở backend; frontend chỉ đọc cờ này để ẩn/hiện nút.
        can_return: order.status === 'Delivered' && isWithinReturnWindow(order),
        return_deadline: order.status === 'Delivered' ? getReturnDeadline(order) : null,
        voucher: order.voucher ? {
            id: order.voucher.id,
            code: order.voucher.code,
            discount_percent: order.voucher.discount_percent ? Number(order.voucher.discount_percent) : null,
            max_discount_amount: order.voucher.max_discount_amount ? Number(order.voucher.max_discount_amount) : null
        } : null,
        voucher_code: order.voucher?.code || null,
        return_request: order.return_request ? {
            id: order.return_request.id,
            status: order.return_request.status,
            reason_code: order.return_request.reason_code,
            description: order.return_request.description,
            admin_response: order.return_request.admin_response,
            refund_amount: Number(order.return_request.refund_amount),
            items: order.return_request.items?.map(ri => ({
                id: ri.id,
                order_item_id: ri.order_item_id,
                return_quantity: ri.return_quantity,
                refund_amount: Number(ri.refund_amount),
                product_name: ri.order_item?.product?.name ?? null,
                product_name_vi: ri.order_item?.product?.name_vi ?? null,
                product_name_en: ri.order_item?.product?.name_en ?? null,
                color_name: ri.order_item?.color?.color_name ?? null,
                color_name_vi: ri.order_item?.color?.color_name_vi ?? null,
                color_name_en: ri.order_item?.color?.color_name_en ?? null,
                size: ri.order_item?.size?.size ?? null,
                is_gift: ri.order_item?.is_gift ?? false,
                unit_price: ri.order_item?.price != null ? Number(ri.order_item.price) : null,
                original_quantity: ri.order_item?.quantity ?? null
            })) ?? []
        } : null,
        items: order.items.map(item => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: Number(item.price),
            discount_amount: Number(item.discount_amount || 0),
            payable_amount: item.payable_amount !== null ? Number(item.payable_amount) : Number(item.price) * item.quantity,
            is_gift: item.is_gift,
            promotion_id: item.promotion_id ?? null,
            promotion: item.promotion ? {
                id: item.promotion.id,
                buy_product_id: item.promotion.buy_product_id,
                gift_product_id: item.promotion.gift_product_id,
                buy_quantity: item.promotion.buy_quantity,
                gift_quantity: item.promotion.gift_quantity
            } : null,
            product_name: item.product?.name ?? null,
            product_name_vi: item.product?.name_vi ?? null,
            product_name_en: item.product?.name_en ?? null,
            image_url: item.color?.image_url || item.product?.image_url || null,
            color: item.color?.color_name ?? null,
            color_name: item.color?.color_name ?? null,
            color_name_vi: item.color?.color_name_vi ?? null,
            color_name_en: item.color?.color_name_en ?? null,
            size: item.size?.size ?? null,
            color_id: item.color_id,
            size_id: item.size_id,
        }))
    };
}
