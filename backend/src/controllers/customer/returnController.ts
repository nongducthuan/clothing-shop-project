import { Request, Response } from 'express';
import prisma from '../../../prisma/client';
import { parseBankInfo, buildReturnPlan } from '../../services/returnRequestService';
import { sendNotification } from '../../utils/socket';
import { isWithinReturnWindow, ReturnWindowExpiredError } from '../../constants/returnPolicy';

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

// Tăng cường ownership check – JWT user_id ưu tiên hơn email
export const submitReturnRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reason_code, description, returnItems } = req.body;
        const orderId = Number(req.params.id);

        // Parse returnItems (có thể gửi dưới dạng string JSON qua FormData)
        let parsedReturnItems: { order_item_id: number; return_quantity: number }[] = [];
        if (returnItems) {
            try {
                parsedReturnItems = typeof returnItems === 'string' ? JSON.parse(returnItems) : returnItems;
            } catch {
                res.status(400).json({ message: "Invalid returnItems format." });
                return;
            }
        }

        const rawBank = req.body.refund_bank_info || req.body.bankInfo;
        const finalBankInfo = parseBankInfo(rawBank);
        const uploadedFiles = req.files;
        const images = Array.isArray(uploadedFiles)
            ? uploadedFiles.map(file => `/uploads/${file.filename}`)
            : [];

        await prisma.$transaction(async (tx) => {
            // Lấy order và tất cả items (bao gồm thông tin promotion để xác định sản phẩm X của Buy X Get Y)
            // KHÔNG yêu cầu payment_status = 'Paid': đơn COD đã giao có thể vẫn 'Unpaid' nếu admin
            // chưa đánh dấu thu tiền → vẫn phải cho khách đổi trả.
            // Việc có cần hoàn tiền hay không quyết định sau, dựa trên payment_status
            // (Paid → set 'Refunded' khi approve, Unpaid → không cần hoàn).
            const order = await tx.order.findFirst({
                where: { id: orderId, status: 'Delivered' },
                include: { items: { include: { promotion: true } } }
            });
            if (!order) {
                throw new Error("The order is invalid or not delivered.");
            }

            // Kiểm tra ownership
            const isAdmin = req.user?.role === 'admin';
            if (order.user_id) {
                if (!isAdmin && (!req.user || req.user.id !== order.user_id)) {
                    throw new Error("Forbidden: This order belongs to another member.");
                }
            } else {
                if (!isAdmin && (!req.guestOrderEmail || order.email.toLowerCase() !== req.guestOrderEmail)) {
                    throw new Error("Forbidden: Verify the guest order by OTP before requesting a return.");
                }
            }

            // Chính sách đổi trả 7 ngày kể từ khi giao. Kiểm tra SAU ownership để người không có
            // quyền không dò được thông tin đơn. Admin được phép xử lý ngoại lệ thay khách.
            if (!isAdmin && !isWithinReturnWindow(order)) {
                throw new ReturnWindowExpiredError();
            }

            const existing = await tx.returnRequest.findUnique({ where: { order_id: orderId } });
            if (existing) {
                throw new Error("A return request has already been submitted for this order.");
            }

            const { returnItemsToCreate, totalRefundAmount } = buildReturnPlan(order, parsedReturnItems);

            await tx.returnRequest.create({
                data: {
                    order_id: orderId,
                    reason_code,
                    description: description || null,
                    images: JSON.stringify(images),
                    refund_bank_info: JSON.stringify(finalBankInfo),
                    refund_amount: totalRefundAmount,
                    status: 'Pending',
                    items: {
                        create: returnItemsToCreate
                    }
                }
            });

            await tx.order.update({
                where: { id: orderId },
                data: { status: 'Return_Requested' }
            });
        });

        // Emit realtime notification to Admin
        try {
            await sendNotification(prisma, null, 'Yêu cầu trả hàng', `Đơn hàng #${orderId} có yêu cầu trả hàng mới`, 'Return Request', `Order #${orderId} has a new return request`, 'new_return_request', { orderId, customerName: req.user?.email || req.guestOrderEmail || `Order #${orderId}` });
        } catch (e) {
            console.error('Socket emit return error:', e);
        }

        res.status(200).json({ message: "Return request submitted successfully" });
    } catch (error: unknown) {
        console.error("ERROR_SUBMIT_RETURN:", error);
        const message = errorMessage(error);
        const status = message.startsWith('Forbidden:') ? 403 : error instanceof ReturnWindowExpiredError ? 400 : 500;
        res.status(status).json({ message });
    }
};

export const cancelReturnRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const orderId = Number(req.params.id);
        const verifiedEmail = req.guestOrderEmail || req.user?.email?.toLowerCase() || '';

        await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { return_request: true }
            });

            if (!order) {
                throw new Error(`Order #${orderId} not found.`);
            }

            const isReturnRequested = ['Return_Requested', 'Return Requested'].includes(order.status as string);
            // Sau khi admin hoàn tác quyết định nhầm (approve/reject), đơn về Delivered nhưng
            // return_request còn Pending (chờ duyệt lại) — khách vẫn được rút yêu cầu của mình.
            const isPendingRedo = order.status === 'Delivered' && order.return_request?.status === 'Pending';
            if (!isReturnRequested && !isPendingRedo) {
                throw new Error(`Order #${orderId} is not in Return Requested status (current status: '${order.status}').`);
            }

            // Ownership check – supports member user_id match or email match
            const isAdmin = req.user?.role === 'admin';
            const matchesUserId = order.user_id && req.user?.id === order.user_id;
            const matchesEmail = verifiedEmail && order.email.toLowerCase() === verifiedEmail;

            if (!isAdmin && !matchesUserId && !matchesEmail) {
                throw new Error("Forbidden: You do not have permission to cancel this return request.");
            }

            // Delete the return request (if exists) and revert order status to Delivered
            if (order.return_request) {
                await tx.returnRequest.delete({ where: { order_id: orderId } });
            } else {
                await tx.returnRequest.deleteMany({ where: { order_id: orderId } });
            }

            await tx.order.update({
                where: { id: orderId },
                data: { status: 'Delivered' }
            });
        });

        // Emit realtime socket event to Admin
        try {
            await sendNotification(prisma, null, 'Hủy yêu cầu trả hàng', `Yêu cầu trả hàng cho đơn #${orderId} đã bị hủy`, 'Return Request Cancelled', `Return request for order #${orderId} has been cancelled`, 'return_cancelled', { orderId });
        } catch (e) {
            console.error('Socket emit error (return_cancelled):', e);
        }

        res.status(200).json({ message: "Return request cancelled successfully." });
    } catch (error: unknown) {
        console.error("ERROR_CANCEL_RETURN:", error);
        const message = errorMessage(error);
        res.status(message.startsWith('Forbidden:') ? 403 : 500).json({ message });
    }
};
