import prisma from '../../prisma/client';
import type { Prisma, OrderStatus, PaymentStatus } from '../generated/prisma/client';
import type { TxClient } from '../types/orderTypes';
import { updateOrderInventory } from './orderStatusInventoryService';
import { updateOrderFinancials } from './orderStatusFinancialService';
import {
    ALLOWED_STATUS_TRANSITIONS,
    RETURN_STATUS_ENUMS,
    STATUS_DISPLAY_TO_ENUM,
    STATUS_RANK,
    isUndoTransition,
} from '../constants/orderStatus';

/** Lỗi nghiệp vụ có kèm HTTP status — controller chỉ việc map sang response. */
export class OrderServiceError extends Error {
    readonly httpStatus: number;
    constructor(httpStatus: number, message: string) {
        super(message);
        this.name = 'OrderServiceError';
        this.httpStatus = httpStatus;
    }
}

export const isOrderServiceError = (err: unknown): err is OrderServiceError =>
    err instanceof Error && err.name === 'OrderServiceError';


type GiftQuotaItem = { is_gift: boolean; promotion_id: number | null; quantity: number };

/** Adjust the campaign's reserved gift counter when a pending order is cancelled or restored. */
export async function updateGiftPromotionQuota(
    tx: TxClient,
    items: GiftQuotaItem[],
    action: 'release' | 'reserve'
): Promise<void> {
    const quantities = new Map<number, number>();
    for (const item of items) {
        if (!item.is_gift || item.promotion_id == null || item.quantity <= 0) continue;
        quantities.set(item.promotion_id, (quantities.get(item.promotion_id) ?? 0) + item.quantity);
    }

    for (const [promotionId, quantity] of quantities) {
        let completed = false;
        for (let attempt = 0; attempt < 5; attempt += 1) {
            const promotion = await tx.buyXGetYPromotion.findUnique({
                where: { id: promotionId },
                select: { total_gift_limit: true, total_gifts_issued: true },
            });
            if (!promotion) {
                if (action === 'release') {
                    completed = true;
                    break;
                }
                throw new OrderServiceError(409, 'Gift promotion is no longer available; the cancelled order cannot be restored.');
            }

            const issued = Math.max(0, Number(promotion.total_gifts_issued) || 0);
            const nextCount = action === 'release' ? Math.max(0, issued - quantity) : issued + quantity;
            if (action === 'reserve' && promotion.total_gift_limit !== null && nextCount > promotion.total_gift_limit) {
                throw new OrderServiceError(409, 'Gift quota has been consumed by other orders; this order cannot be restored.');
            }

            const result = await tx.buyXGetYPromotion.updateMany({
                where: {
                    id: promotionId,
                    total_gifts_issued: promotion.total_gifts_issued,
                    total_gift_limit: promotion.total_gift_limit,
                },
                data: {
                    total_gifts_issued: action === 'release'
                        ? { decrement: issued - nextCount }
                        : { increment: quantity },
                },
            });
            if (result.count === 1) {
                completed = true;
                break;
            }
        }

        if (!completed) {
            throw new OrderServiceError(409, 'Gift quota changed concurrently. Please refresh and retry.');
        }
    }
}

// Complex status change handling inventory and revenue
// opts.partial: khi approve đổi trả 1 phần — chỉ hoàn kho + trừ tiền đúng các item
// được trả (returnItems: [{size_id, return_quantity}], refundAmount), thay vì toàn bộ đơn.
// approveReturn PHẢI đi qua đường này để kho/doanh thu/spending chỉ có 1 nơi tính.
export type StatusLogicOpts = {
    isUndo?: boolean;
    skipFinancial?: boolean;
    skipStock?: boolean;
    partial?: { returnItems: { size_id: number | null; return_quantity: number }[]; refundAmount: number };
};

export const changeOrderStatusLogic = async (
    orderId: number,
    newStatus: string,
    opts?: StatusLogicOpts
) => {
    return await prisma.$transaction(async (tx) => {
        await changeOrderStatusLogicTx(tx, orderId, newStatus, opts);
    });
};

// Core logic chạy trên transaction caller truyền vào — dùng để gộp approveReturn
// (update ReturnRequest + hoàn kho + đổi status + trừ tiền) vào 1 transaction duy nhất.
export const changeOrderStatusLogicTx = async (
    tx: TxClient,
    orderId: number,
    newStatus: string,
    opts?: StatusLogicOpts
) => {
    // Normalize: "Return Requested" → "Return_Requested" etc.
    const normalizedStatus = STATUS_DISPLAY_TO_ENUM[newStatus] ?? newStatus;

    {
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (!order) throw new Error("Order not found");

        const oldStatus = order.status;
        const orderVoucherId = order.voucher_id;

        // 0. Chống đi lùi: IPN đến trễ/retry hoặc caller nội bộ không được kéo đơn về
        // trạng thái trước đó (VD: Delivered → Confirmed sẽ trừ doanh thu + total_spent).
        // Normalize cả oldStatus để khớp cả 2 biến thể "Return Requested"/"Return_Requested".
        // Ngoại lệ: opts.isUndo (chỉ updateOrderStatus khi khớp UNDO_TRANSITIONS) được phép
        // quay lại đúng 1 bước có kiểm soát — hậu quả đảo chiều do chính logic này xử lý.
        const oldEnum = STATUS_DISPLAY_TO_ENUM[oldStatus] ?? oldStatus;
        const oldRank: number | undefined = STATUS_RANK[oldEnum];
        const newRank: number | undefined = STATUS_RANK[normalizedStatus];
        if (!opts?.isUndo && oldRank !== undefined && newRank !== undefined && newRank < oldRank) {
            console.warn(
                `⛔ Blocked status regression for order #${orderId}: ${oldStatus} → ${normalizedStatus}`
            );
            throw new Error(
                `Invalid status transition: cannot move order #${orderId} from "${oldStatus}" back to "${normalizedStatus}"`
            );
        }

        const inactiveSet = new Set(["Cancelled", "Return_Approved"]);
        const oldIsInactive = inactiveSet.has(oldEnum);
        const newIsInactive = inactiveSet.has(normalizedStatus);
        await updateOrderInventory(tx, order, oldEnum, normalizedStatus, opts);

        if (normalizedStatus === 'Cancelled' && ['Pending', 'Confirmed', 'Shipping'].includes(oldEnum)) {
            await updateGiftPromotionQuota(tx, order.items, 'release');
        } else if (oldEnum === 'Cancelled' && normalizedStatus === 'Pending') {
            await updateGiftPromotionQuota(tx, order.items, 'reserve');
        }

        const { deliveredAtUpdate } = await updateOrderFinancials(tx, order, oldEnum, normalizedStatus, opts);

        // 3. Update Order
        const updateData: Prisma.OrderUpdateInput = { status: normalizedStatus as OrderStatus };
        if (deliveredAtUpdate) updateData.delivered_at = deliveredAtUpdate;

        // If money was collected, mark the order refunded when it enters a closed state.
        // Use payment_status rather than payment_method so collected COD payments are handled too.
        let paymentTransition: { from: PaymentStatus; to: PaymentStatus } | null = null;
        if (newIsInactive && !oldIsInactive && order.payment_status === 'Paid') {
            updateData.payment_status = 'Refunded';
            paymentTransition = { from: 'Paid', to: 'Refunded' };
        }

        await tx.order.update({
            where: { id: orderId },
            data: updateData
        });

        if (paymentTransition) {
            await tx.paymentStatusLog.create({
                data: {
                    order_id: orderId,
                    from_status: paymentTransition.from,
                    to_status: paymentTransition.to,
                    changed_by: null,
                    note: `Auto: ${oldStatus} -> ${normalizedStatus}`,
                },
            });
        }

        // 5. Hoàn voucher khi đơn bị hủy TRƯỚC khi giao (Pending/Confirmed/Shipping → Cancelled):
        // voucher chỉ nên bị trừ hẳn khi đơn Delivered. Hủy sớm mà mất voucher là thiệt cho khách.
        // (Return_Approved KHÔNG hoàn — khách đã nhận hàng rồi mới trả, voucher đã tiêu là đúng.)
        // Voucher không giới hạn (usage_limit null) chỉ giảm used_count, không tăng limit.
        if (
            orderVoucherId &&
            normalizedStatus === "Cancelled" &&
            oldStatus !== "Delivered" &&
            (oldEnum === "Pending" || oldEnum === "Confirmed" || oldEnum === "Shipping")
        ) {
            const v = await tx.voucher.findUnique({ where: { id: orderVoucherId } });
            if (v) {
                await tx.voucher.update({
                    where: { id: orderVoucherId },
                    data: v.usage_limit !== null && v.usage_limit !== undefined
                        ? { usage_limit: { increment: 1 }, used_count: { decrement: 1 } }
                        : { used_count: v.used_count > 0 ? { decrement: 1 } : undefined },
                });
            }
        }
    }
};

/**
 * Validate luồng + xử lý undo + gọi changeOrderStatusLogic cho thao tác đổi trạng thái của admin.
 * Ném OrderServiceError(404/400) khi không hợp lệ. Trả `userId` để caller gửi thông báo.
 */
export const updateOrderStatusByAdmin = async (
    orderId: number,
    status: string
): Promise<{ userId: number | null }> => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, user_id: true }
    });
    if (!order) throw new OrderServiceError(404, 'Order not found.');

    const normalizedStatus = STATUS_DISPLAY_TO_ENUM[status] ?? status;

    // Undo có kiểm soát: bấm nhầm/đổi ý — chỉ 3 cặp chính xác được quay lại
    // (Delivered→Shipping, Cancelled→Pending, Return_Rejected→Return_Requested).
    // Mỗi cặp có hậu quả đảo chiều đã được xử lý đối xứng trong changeOrderStatusLogic;
    // Return_Rejected→Return_Requested cần skipFinancial vì reject chưa hề trừ doanh thu
    // (giữ luôn nhánh cũ →Delivered cho dữ liệu đã hoàn tác bằng phiên bản trước).
    const oldEnum = STATUS_DISPLAY_TO_ENUM[order.status] ?? order.status;
    const isUndo = isUndoTransition(oldEnum, normalizedStatus);
    const skipFinancial =
        oldEnum === 'Return_Rejected' &&
        (normalizedStatus === 'Return_Requested' || normalizedStatus === 'Delivered');

    // Validate luồng: chặn nhảy bước / nhảy vào trạng thái đổi trả qua API này.
    // Cho phép khi trạng thái không đổi (no-op) để không phá các lần bấm lặp.
    if (normalizedStatus !== order.status && !isUndo) {
        if (RETURN_STATUS_ENUMS.includes(normalizedStatus)) {
            console.warn(`Blocked direct set of return status "${normalizedStatus}" on order #${orderId}`);
            throw new OrderServiceError(400, 'Return statuses must be updated via the approve or reject return action.');
        }

        const allowedTargets = ALLOWED_STATUS_TRANSITIONS[order.status];
        if (!allowedTargets || !allowedTargets.includes(normalizedStatus)) {
            console.warn(`Blocked invalid status transition ${order.status} → ${normalizedStatus} on order #${orderId}`);
            throw new OrderServiceError(400, 'Invalid status transition for this order.');
        }
    }

    if (isUndo && skipFinancial) {
        // Undo từ chối nhầm (Return_Rejected → Return_Requested): trả ReturnRequest về
        // Pending + xóa lý do từ chối (quyết định đã bị rút lại) trong CÙNG transaction —
        // đối xứng với undoApproveReturn — để admin bấm Approve/Reject lại ngay mà
        // khách không phải gửi lại yêu cầu đổi trả lần 2. Đơn về "Return Requested"
        // (không phải "Delivered") vì yêu cầu đổi trả vẫn đang mở.
        await prisma.$transaction(async (tx) => {
            await changeOrderStatusLogicTx(tx, orderId, status, { isUndo, skipFinancial });
            await tx.returnRequest.updateMany({
                where: { order_id: orderId },
                data: { status: 'Pending', admin_response: null },
            });
        });
    } else {
        await changeOrderStatusLogic(orderId, status, { isUndo, skipFinancial });
    }

    return { userId: order.user_id ?? null };
};

// State machine cho tiền — đối xứng với ALLOWED_STATUS_TRANSITIONS của đơn:
// Unpaid -> Paid | Refunded | giữ nguyên
// Paid -> Refunded | Unpaid | giữ nguyên
//   Paid -> Unpaid = undo "bấm nhầm Đã thanh toán" khi tiền CHƯA thật sự thu
//   (điển hình COD). MoMo/VNPay: Paid thường do webhook cổng ghi — admin phải
//   đối chiếu cổng thanh toán trước khi hoàn tác. Mọi lần đổi đều ghi audit log.
// Refunded -> Paid (lỡ bấm hoàn nhầm mà chưa chuyển tiền thật) | giữ nguyên
const ALLOWED_PAYMENT_TRANSITIONS: Record<string, string[]> = {
    Unpaid: ['Unpaid', 'Paid', 'Refunded'],
    Paid: ['Paid', 'Refunded', 'Unpaid'],
    Refunded: ['Refunded', 'Paid'],
};

/**
 * Đổi payment_status của đơn + ghi PaymentStatusLog trong 1 transaction.
 * Refunded chỉ hợp lệ khi đơn đã đóng (Cancelled / Return_Approved):
 * đơn đang mở mà đánh dấu Refunded là sổ sai.
 */
export const confirmPaymentStatus = async (
    orderId: number,
    paymentStatus: unknown,
    changedBy: number | null
): Promise<void> => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new OrderServiceError(404, 'Order not found.');

    const from: PaymentStatus = order.payment_status;
    const to = String(paymentStatus) as PaymentStatus;

    if (!ALLOWED_PAYMENT_TRANSITIONS[from]?.includes(to)) {
        throw new OrderServiceError(400, `Invalid payment transition: ${from} -> ${to}.`);
    }
    if (to === 'Refunded' && from !== 'Refunded') {
        const orderEnum = STATUS_DISPLAY_TO_ENUM[order.status as string] ?? (order.status as string);
        if (!['Cancelled', 'Return_Approved'].includes(orderEnum)) {
            throw new OrderServiceError(400, 'Refunded is only allowed for Cancelled or Return Approved orders.');
        }
    }

    if (to === 'Paid' && from === 'Unpaid') {
        const orderEnum = STATUS_DISPLAY_TO_ENUM[order.status as string] ?? (order.status as string);
        if (['Cancelled', 'Return_Approved'].includes(orderEnum)) {
            throw new OrderServiceError(400, 'A cancelled or approved return cannot be marked Paid from Unpaid.');
        }
    }

    if (from === to) return;

    await prisma.$transaction([
        prisma.order.update({ where: { id: orderId }, data: { payment_status: to } }),
        prisma.paymentStatusLog.create({
            data: {
                order_id: orderId,
                from_status: from,
                to_status: to,
                changed_by: changedBy,
                note: 'Admin manual update',
            },
        }),
    ]);
};
