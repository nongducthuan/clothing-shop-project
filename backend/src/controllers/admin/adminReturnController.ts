import { Request, Response } from 'express';
import type { Prisma } from '../../generated/prisma/client';
import prisma from '../../../prisma/client';
import { sendNotification } from '../../utils/socket';
import { STATUS_DISPLAY_TO_ENUM } from '../../constants/orderStatus';
import { changeOrderStatusLogicTx } from '../../services/orderStatusService';

export const approveReturn = async (req: Request, res: Response): Promise<void> => {
    const orderId = Number(req.params.id);
    try {
        let userIdToNotify: number | null = null;

        await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                select: { status: true, user_id: true },
            });
            if (!order) throw new Error('Order not found.');
            const orderStatus = STATUS_DISPLAY_TO_ENUM[order.status as string] ?? (order.status as string);
            if (!['Delivered', 'Return_Requested'].includes(orderStatus)) {
                throw new Error('Only delivered orders with a pending return can be approved.');
            }

            const returnReq = await tx.returnRequest.findUnique({
                where: { order_id: orderId },
                include: { items: { include: { order_item: true } } },
            });
            if (returnReq && returnReq.status !== 'Pending') {
                throw new Error('Only a pending return request can be approved.');
            }
            userIdToNotify = order.user_id;

            const refundAmount = returnReq ? Number(returnReq.refund_amount) : 0;
            const hasPartialItems = !!returnReq?.items && returnReq.items.length > 0;
            const shippingRefund = returnReq ? Number(returnReq.shipping_refund ?? 0) : 0;

            if (returnReq) {
                await tx.returnRequest.update({
                    where: { order_id: orderId },
                    data: { status: 'Approved', admin_response: null }
                });
            } else {
                await tx.returnRequest.create({
                    data: {
                        order_id: orderId,
                        reason_code: 'Admin Approval',
                        description: 'Manually approved by admin',
                        status: 'Approved',
                        admin_response: null
                    }
                });
            }

            if (hasPartialItems) {
                await changeOrderStatusLogicTx(tx, orderId, 'Return_Approved', {
                    partial: {
                        returnItems: returnReq!.items.map((retItem) => ({
                            size_id: retItem.order_item.size_id,
                            return_quantity: retItem.return_quantity,
                        })),
                        refundAmount: refundAmount + shippingRefund,
                    },
                });
            } else {
                // Manual approval without item details is treated as a full return.
                await changeOrderStatusLogicTx(tx, orderId, 'Return_Approved');
            }
        });

        if (userIdToNotify) {
            await sendNotification(
                prisma,
                userIdToNotify,
                `Yêu cầu trả hàng #${orderId} được duyệt`,
                `Yêu cầu trả hàng của bạn đã được admin duyệt thành công.`,
                `Return request #${orderId} approved`,
                `Your return request has been successfully approved by admin.`,
                'customer_notification',
                { orderId }
            );
        }
        res.status(200).json({ message: "Return request approved successfully!" });
    } catch (err: unknown) {
        console.error(err);
        res.status(500).json({ message: err instanceof Error ? err.message : "Server Error" });
    }
};

// Hoàn tác duyệt nhầm Return Approved — thay thế runbook SQL trong README.
// Admin chốt 2 dữ kiện đã gọi điện xác nhận với khách:
//   - stock_returned: hàng đã gửi trả về kho thật chưa?
//     false → trừ lại kho (số đã cộng nhầm lúc approve). true → giữ nguyên.
//   - money_refunded: tiền đã hoàn ra ngoài thật chưa?
//     false → Refunded → Paid. true → giữ Refunded.
// Toàn bộ đảo ngược (kho + doanh thu/total_spent/membership + payment + status)
// chạy trong 1 transaction duy nhất — crash giữa chừng không lệch sổ.
// ReturnRequest KHÔNG xóa, chỉ trả về Pending để còn lịch sử; đơn quay về
// "Return Requested" (yêu cầu vẫn đang mở — chờ admin quyết định lại), KHÔNG phải
// "Delivered" như bản cũ vì như vậy đơn trông như đã giao xong giữa lúc còn đổi trả.
export const undoApproveReturn = async (req: Request, res: Response): Promise<void> => {
    const orderId = Number(req.params.id);
    const { stock_returned = true, money_refunded = true } = req.body ?? {};
    try {
        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true },
            });
            if (!order) throw new Error("Order not found.");
            const oldEnum = STATUS_DISPLAY_TO_ENUM[order.status as string] ?? (order.status as string);
            if (oldEnum !== "Return_Approved") {
                throw new Error(`Only a Return Approved order can be un-approved (current: "${order.status}").`);
            }

            const returnReq = await tx.returnRequest.findUnique({
                where: { order_id: orderId },
                include: { items: { include: { order_item: true } }, order: { select: { user_id: true } } },
            });
            const hasPartialItems = !!returnReq?.items && returnReq.items.length > 0;
            const refundAmount = returnReq ? Number(returnReq.refund_amount) : 0;
            const shippingRefund = returnReq ? Number(returnReq.shipping_refund ?? 0) : 0;
            const restoreAmount = hasPartialItems ? refundAmount + shippingRefund : Number(order.total_price);

            // 1. Trừ lại kho nếu hàng chưa về (đảo của lúc approve cộng kho)
            if (!stock_returned) {
                const toDeduct: { size_id: number | null; qty: number }[] = hasPartialItems
                    ? returnReq!.items.map((retItem) => ({ size_id: retItem.order_item.size_id, qty: retItem.return_quantity }))
                    : order.items.map((item) => ({ size_id: item.size_id, qty: item.quantity }));
                for (const d of toDeduct) {
                    if (!d.size_id) continue;
                    const size = await tx.productSize.findUnique({ where: { id: d.size_id } });
                    if (!size || Number(size.stock) < d.qty) {
                        throw new Error(`Insufficient stock for product (size_id=${d.size_id})`);
                    }
                    await tx.productSize.update({
                        where: { id: d.size_id },
                        data: { stock: { decrement: d.qty } },
                    });
                }
            }

            // 2. Cộng lại doanh thu đúng ngày giao gốc (đảo của lúc approve trừ tiền).
            // Partial: cộng refundAmount, KHÔNG cộng order count.
            // Full: cộng cả đơn + count.
            const revenueDate = order.delivered_at ? new Date(order.delivered_at) : new Date();
            revenueDate.setHours(0, 0, 0, 0);
            const revenuePayload: Prisma.RevenueUpdateInput = {
                total_sales: { increment: Math.max(0, restoreAmount) },
                ...(hasPartialItems ? {} : { total_orders: { increment: 1 } }),
            };
            const existingRevenue = await tx.revenue.findUnique({ where: { report_date: revenueDate } });
            if (existingRevenue) {
                await tx.revenue.update({ where: { report_date: revenueDate }, data: revenuePayload });
            } else {
                await tx.revenue.create({
                    data: {
                        report_date: revenueDate,
                        total_sales: Math.max(0, restoreAmount),
                        total_orders: hasPartialItems ? 0 : 1,
                    },
                });
            }

            // 3. Cộng lại total_spent + tính lại hạng membership (đảo của lúc approve)
            if (order.user_id && restoreAmount > 0) {
                const currentUser = await tx.user.findUnique({ where: { id: order.user_id } });
                if (currentUser) {
                    const newTotalSpent = Number(currentUser.total_spent) + restoreAmount;
                    await tx.user.update({ where: { id: order.user_id }, data: { total_spent: newTotalSpent } });
                    const tier = await tx.membership.findFirst({
                        where: { min_spending: { lte: newTotalSpent }, is_active: true },
                        orderBy: { min_spending: 'desc' },
                    });
                    await tx.user.update({ where: { id: order.user_id }, data: { membership_id: tier?.id ?? null } });
                }
            }

            // 4. Trả status về Return_Requested + trả ReturnRequest về Pending (giữ lịch sử).
            // Yêu cầu đổi trả của khách vẫn đang mở ⇒ đơn phải nằm lại đúng vòng chờ duyệt
            // ("Yêu cầu đổi trả"), KHÔNG phải Delivered — nếu để Delivered thì đơn bị hiển thị
            // như đã giao xong trong khi yêu cầu đổi trả vẫn treo, và trùng với chiều hoàn tác
            // từ chối nhầm (2 chiều không còn phân biệt được).
            // isUndo để vượt guard chống đi lùi (rank 5 → 5); skip stock/financial
            // vì kho + tiền đã tự đảo ở bước 1-3.
            await changeOrderStatusLogicTx(tx, orderId, 'Return_Requested', { isUndo: true, skipFinancial: true, skipStock: true });
            if (returnReq) {
                await tx.returnRequest.update({
                    where: { order_id: orderId },
                    data: { status: 'Pending', admin_response: null },
                });
            }

            // 5. Payment: chỉ đảo Refunded → Paid khi tiền chưa ra ngoài thật.
            let paymentRestored = false;
            if (!money_refunded && order.payment_status === 'Refunded') {
                await tx.order.update({ where: { id: orderId }, data: { payment_status: 'Paid' } });
                await tx.paymentStatusLog.create({
                    data: {
                        order_id: orderId,
                        from_status: 'Refunded',
                        to_status: 'Paid',
                        changed_by: req.user?.id ?? null,
                        note: 'Undo approve: money not yet refunded',
                    },
                });
                paymentRestored = true;
            }

            return { restoreAmount, hasPartialItems, paymentRestored };
        });

        res.status(200).json({ message: "Return approval undone. Order is back to Return Requested.", ...result });
    } catch (err: unknown) {
        console.error(err);
        res.status(500).json({ message: err instanceof Error ? err.message : "Server Error" });
    }
};

export const rejectReturn = async (req: Request, res: Response): Promise<void> => {
    const orderId = Number(req.params.id);
    const { adminNote } = req.body;
    try {
        await prisma.$transaction(async (tx) => {
            const current = await tx.order.findUnique({
                where: { id: orderId },
                select: { status: true },
            });
            if (!current) throw new Error('Order not found.');
            const currentEnum = STATUS_DISPLAY_TO_ENUM[current.status as string] ?? (current.status as string);
            const rejectFromDelivered = currentEnum === 'Delivered';
            if (!rejectFromDelivered && currentEnum !== 'Return_Requested') {
                throw new Error('Only delivered orders with a pending return can be rejected.');
            }

            const existing = await tx.returnRequest.findUnique({ where: { order_id: orderId } });
            if (existing && existing.status !== 'Pending') {
                throw new Error('Only a pending return request can be rejected.');
            }
            if (existing) {
                await tx.returnRequest.update({
                    where: { order_id: orderId },
                    data: { status: 'Rejected', admin_response: adminNote }
                });
            } else {
                await tx.returnRequest.create({
                    data: {
                        order_id: orderId,
                        reason_code: 'Admin Rejection',
                        description: 'Manually rejected by admin',
                        status: 'Rejected',
                        admin_response: adminNote || 'Rejected by admin'
                    }
                });
            }
            await changeOrderStatusLogicTx(
                tx,
                orderId,
                'Return_Rejected',
                rejectFromDelivered ? { skipFinancial: true } : undefined
            );
        });
        res.status(200).json({ message: "Return request rejected successfully." });
    } catch (err: unknown) {
        res.status(500).json({ message: "Failed to reject return request", error: err instanceof Error ? err.message : String(err) });
    }
};
