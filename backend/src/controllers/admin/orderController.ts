import { Request, Response } from 'express';
import prisma from '../../../prisma/client';
import { sendNotification } from '../../utils/socket';
import { ENUM_TO_DISPLAY_STATUS } from '../../constants/orderStatus';
import {
    changeOrderStatusLogic,
    changeOrderStatusLogicTx,
    confirmPaymentStatus,
    isOrderServiceError,
    updateOrderStatusByAdmin,
} from '../../services/orderStatusService';
import { buildOrderFilter } from '../../services/orderFilterService';

const parseJson = (value: unknown): unknown =>
    typeof value === 'string' ? JSON.parse(value) as unknown : value;

const parseStringArray = (value: unknown): string[] => {
    const parsed = parseJson(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
};

// Giữ export cũ để các nơi đang import từ file này (tests, autoCancelService, routes) không vỡ.
export { changeOrderStatusLogic, changeOrderStatusLogicTx };
export { approveReturn, undoApproveReturn, rejectReturn } from './adminReturnController';

export const getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 50 } = req.query;
        // Chuẩn hoá phân trang: trang >= 1, limit trong khoảng 1..100 (chặn limit khổng lồ từ query).
        const p = Math.max(1, Number(page) || 1);
        const l = Math.min(100, Math.max(1, Number(limit) || 50));
        const offset = (p - 1) * l;
        const where = buildOrderFilter(req.query.tab, req.query.status);

        const [ordersRaw, totalOrders] = await Promise.all([
            prisma.order.findMany({
                where,
                skip: offset,
                take: l,
                include: {
                    user: {
                        select: { name: true, email: true }
                    },
                    voucher: {
                        select: { id: true, code: true, discount_percent: true, max_discount_amount: true }
                    },
                    return_request: {
                        include: {
                            items: {
                                include: {
                                    order_item: {
                                        include: {
                                            product: { select: { name: true, name_vi: true, name_en: true, image_url: true } },
                                            color: { select: { color_name: true, color_name_vi: true, color_name_en: true, image_url: true } },
                                            size: { select: { size: true } }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    items: {
                        include: {
                            product: { select: { name: true, name_vi: true, name_en: true, image_url: true } },
                            color: { select: { color_name: true, color_name_vi: true, color_name_en: true, image_url: true } },
                            size: { select: { size: true } }
                        }
                    }
                },
                orderBy: { created_at: 'desc' }
            }),
            // đếm theo ĐÚNG bộ lọc để totalPages khớp dữ liệu phân trang
            prisma.order.count({ where })
        ]);

        const processedOrders = ordersRaw.map(order => {
            let bankInfo = null;
            let returnImages: string[] = [];
            const rr = order.return_request;

            if (rr) {
                try {
                    bankInfo = typeof rr.refund_bank_info === 'string'
                        ? JSON.parse(rr.refund_bank_info)
                        : rr.refund_bank_info;
                    returnImages = parseStringArray(rr.images);
                } catch (e) {
                    console.error("Error parsing return data for order:", order.id, e);
                }
            }

            const items = order.items.map(item => ({
                ...item,
                product_name: item.product?.name,
                product_name_vi: item.product?.name_vi,
                product_name_en: item.product?.name_en,
                image_url: item.color?.image_url || item.product?.image_url,
                color_name: item.color?.color_name,
                color_name_vi: item.color?.color_name_vi,
                color_name_en: item.color?.color_name_en,
                size: item.size?.size
            }));

            const displayStatus = ENUM_TO_DISPLAY_STATUS[order.status] || order.status;
            const normalizedDisplayStatus =
                displayStatus === 'Delivered' && rr?.status === 'Pending' ? 'Return Requested' : displayStatus;

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
                return_items: rr?.items?.map(ri => ({
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
                    max_discount_amount: order.voucher.max_discount_amount ? Number(order.voucher.max_discount_amount) : null
                } : null,
                voucher_code: order.voucher?.code || null,
                items,
                user: undefined,
                return_request: undefined
            };
        });

        res.json({
            data: processedOrders,
            totalPages: Math.ceil(totalOrders / l),
            currentPage: p,
            totalOrders
        });
    } catch (err) {
        console.error("getOrders admin error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
    const { payment_status } = req.body;
    try {
        await confirmPaymentStatus(Number(req.params.id), payment_status, req.user?.id ?? null);
        res.json({ message: `Payment status updated to ${payment_status}` });
    } catch (err) {
        if (isOrderServiceError(err)) {
            res.status(err.httpStatus).json({ message: err.message });
            return;
        }
        console.error(err);
        res.status(500).json({ message: "Server error updating payment" });
    }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const { status } = req.body;
    try {
        const orderId = Number(req.params.id);
        const { userId } = await updateOrderStatusByAdmin(orderId, status);

        if (userId) {
            await sendNotification(
                prisma,
                userId,
                `Đơn hàng #${orderId} cập nhật`,
                `Trạng thái đơn hàng của bạn đã được chuyển thành: ${status}`,
                `Order #${orderId} updated`,
                `Your order status has been changed to: ${status}`,
                'customer_notification',
                { orderId, status }
            );
        }
        res.json({ message: 'Order status updated successfully' });
    } catch (err: unknown) {
        if (isOrderServiceError(err)) {
            res.status(err.httpStatus).json({ message: err.message });
            return;
        }
        console.error(err);
        res.status(500).json({ message: err instanceof Error ? err.message : String(err) });
    }
};

export const changeOrderStatus = updateOrderStatus;
