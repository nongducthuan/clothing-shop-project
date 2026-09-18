import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        // Fix 15: Default limit 500 → 50 để tránh memory spike
        const { page = 1, limit = 50 } = req.query;
        const p = Number(page) || 1;
        const l = Number(limit) || 50;
        const offset = (p - 1) * l;

        const [ordersRaw, totalOrders] = await Promise.all([
            prisma.order.findMany({
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
                                            product: { select: { name: true, name_vi: true, name_en: true } }
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
            prisma.order.count()
        ]);

        const processedOrders = ordersRaw.map(order => {
            let bankInfo = null;
            let returnImages: any[] = [];
            const rr = order.return_request;

            if (rr) {
                try {
                    bankInfo = typeof rr.refund_bank_info === 'string'
                        ? JSON.parse(rr.refund_bank_info)
                        : rr.refund_bank_info;
                    returnImages = typeof rr.images === 'string'
                        ? JSON.parse(rr.images)
                        : rr.images || [];
                } catch (e) {
                    console.error("Error parsing return data for order:", order.id, e);
                }
            }

            // Flatten items for compatibility
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

            return {
                ...order,
                status: ENUM_TO_DISPLAY_STATUS[order.status] || order.status,
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
                return_items: rr?.items || [],
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
    const { id } = req.params;
    const { payment_status } = req.body;

    try {
        await prisma.order.update({
            where: { id: Number(id) },
            data: { payment_status: payment_status as any }
        });

        res.json({ message: `Payment status updated to ${payment_status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error updating payment" });
    }
};

const ENUM_TO_DISPLAY_STATUS: Record<string, string> = {
    "Return_Requested": "Return Requested",
    "Return_Rejected":  "Return Rejected",
    "Return_Approved":  "Return Approved",
};

// Map display names (with spaces, as sent by frontend) → Prisma enum names (with underscores)
const STATUS_DISPLAY_TO_ENUM: Record<string, string> = {
    "Return Requested": "Return_Requested",
    "Return Rejected":  "Return_Rejected",
    "Return Approved":  "Return_Approved",
};

// Luồng trạng thái hợp lệ (khớp với frontend/src/utils/orderUtils.ts):
// Pending → Confirmed → Shipping → Delivered, hoặc Cancelled ở bất kỳ bước nào.
// Phải validate ở backend vì UI chỉ chặn được ở dropdown —
// gọi API trực tiếp vẫn có thể nhảy bước và làm sai kho/doanh thu.
const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
    Pending: ["Confirmed", "Cancelled"],
    Confirmed: ["Shipping", "Cancelled"],
    Shipping: ["Delivered", "Cancelled"],
    Delivered: [],
    Cancelled: [],
};

// 3 trạng thái đổi trả chỉ được đổi qua /return/approve hoặc /return/reject
const RETURN_STATUS_ENUMS = ["Return_Requested", "Return_Approved", "Return_Rejected"];

// Complex status change handling inventory and revenue
export const changeOrderStatusLogic = async (orderId: number, newStatus: string) => {
    // Normalize: "Return Requested" → "Return_Requested" etc.
    const normalizedStatus = STATUS_DISPLAY_TO_ENUM[newStatus] ?? newStatus;

    return await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (!order) throw new Error("Order not found");

        const oldStatus = order.status;
        const totalPrice = Number(order.total_price);
        const userId = order.user_id;

        // 1. Inventory Updates
        const inactiveSet = new Set(["Cancelled", "Return_Approved"]);

        const oldIsInactive = inactiveSet.has(oldStatus);
        const newIsInactive = inactiveSet.has(normalizedStatus as any);

        if (oldIsInactive !== newIsInactive) {
            for (const item of order.items) {
                if (!item.size_id) continue;

                if (!oldIsInactive && newIsInactive) {
                    // Restore stock (Cancelled / Return Approved)
                    await tx.productSize.update({
                        where: { id: item.size_id },
                        data: { stock: { increment: item.quantity } }
                    });
                } else if (oldIsInactive && !newIsInactive) {
                    // Deduct stock (e.g. Cancelled → Pending)
                    const size = await tx.productSize.findUnique({ where: { id: item.size_id } });
                    if (!size || size.stock < item.quantity) {
                        throw new Error(`Insufficient stock for product (size_id=${item.size_id})`);
                    }
                    await tx.productSize.update({
                        where: { id: item.size_id },
                        data: { stock: { decrement: item.quantity } }
                    });
                }
            }
        }

        // 2. Financial Updates
        let revenueChange = 0;
        let orderCountChange = 0;
        let deliveredAtUpdate: Date | null = null;

        if (oldStatus !== "Delivered" && normalizedStatus === "Delivered") {
            revenueChange = totalPrice;
            orderCountChange = 1;
            deliveredAtUpdate = new Date(); // Fix 7: ghi lại thời điểm giao hàng
        } else if ((normalizedStatus === "Return_Approved" || normalizedStatus === "Cancelled") && oldStatus === "Delivered") {
            revenueChange = -totalPrice;
            orderCountChange = -1;
        } else if (oldStatus === "Delivered" && normalizedStatus !== "Delivered") {
            revenueChange = -totalPrice;
            orderCountChange = -1;
        }

        // Fix 6: Update User Spending – đảm bảo total_spent không bị âm
        if (revenueChange !== 0 && userId) {
            const currentUser = await tx.user.findUnique({ where: { id: userId } });
            if (currentUser) {
                const newTotalSpent = Math.max(0, Number(currentUser.total_spent) + revenueChange);
                await tx.user.update({
                    where: { id: userId },
                    data: { total_spent: newTotalSpent }
                });

                const tier = await tx.membership.findFirst({
                    where: { min_spending: { lte: newTotalSpent } },
                    orderBy: { min_spending: 'desc' }
                });
                if (tier) {
                    await tx.user.update({
                        where: { id: userId },
                        data: { membership_id: tier.id }
                    });
                }
            }
        }

        // Fix 7: Update Daily Revenues – dùng ngày giao hàng thực tế, không phải ngày hôm nay
        if (revenueChange !== 0 || orderCountChange !== 0) {
            // Xác định ngày để ghi revenue:
            // - Khi status → Delivered: dùng ngày hôm nay
            // - Khi cancel/return từ Delivered: dùng delivered_at của đơn (ngày gốc)
            let revenueDate: Date;
            if (normalizedStatus === "Delivered") {
                revenueDate = new Date();
            } else if (order.delivered_at) {
                revenueDate = new Date(order.delivered_at);
            } else {
                revenueDate = new Date(); // fallback nếu chưa có delivered_at
            }
            revenueDate.setHours(0, 0, 0, 0);

            const existingRevenue = await tx.revenue.findUnique({
                where: { report_date: revenueDate }
            });

            if (existingRevenue) {
                await tx.revenue.update({
                    where: { report_date: revenueDate },
                    data: {
                        total_sales: { increment: revenueChange },
                        total_orders: { increment: orderCountChange }
                    }
                });
            } else {
                await tx.revenue.create({
                    data: {
                        report_date: revenueDate,
                        total_sales: Math.max(0, revenueChange),
                        total_orders: Math.max(0, orderCountChange)
                    }
                });
            }
        }

        // 3. Update Order
        const updateData: any = { status: normalizedStatus as any };
        if (deliveredAtUpdate) updateData.delivered_at = deliveredAtUpdate; // Fix 7

        // 4. Cờ hoàn tiền: đơn ĐÃ thu tiền mà bị hủy / chấp nhận đổi trả → đánh dấu 'Refunded'
        // để admin biết cần hoàn tiền cho khách.
        // Quyết định dựa trên payment_status (tiền đã thu chưa), KHÔNG dựa vào payment_method
        // (COD giao xong vẫn đã thu tiền mặt). Chỉ set khi thực sự chuyển vào trạng thái
        // inactive → gọi lại nhiều lần cũng không ghi đè sai.
        if (newIsInactive && !oldIsInactive && order.payment_status === 'Paid') {
            updateData.payment_status = 'Refunded';
        }

        await tx.order.update({
            where: { id: orderId },
            data: updateData
        });
    });
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const orderId = Number(id);

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true }
        });
        if (!order) {
            res.status(404).json({ message: "Order not found." });
            return;
        }

        const normalizedStatus = STATUS_DISPLAY_TO_ENUM[status] ?? status;

        // Validate luồng: chặn nhảy bước / nhảy vào trạng thái đổi trả qua API này.
        // Cho phép khi trạng thái không đổi (no-op) để không phá các lần bấm lặp.
        if (normalizedStatus !== order.status) {
            if (RETURN_STATUS_ENUMS.includes(normalizedStatus)) {
                console.warn(`Blocked direct set of return status "${normalizedStatus}" on order #${orderId}`);
                res.status(400).json({
                    message: "Return statuses must be updated via the approve or reject return action."
                });
                return;
            }

            const allowedTargets = ALLOWED_STATUS_TRANSITIONS[order.status];
            if (!allowedTargets || !allowedTargets.includes(normalizedStatus)) {
                console.warn(`Blocked invalid status transition ${order.status} → ${normalizedStatus} on order #${orderId}`);
                res.status(400).json({ message: "Invalid status transition for this order." });
                return;
            }
        }

        await changeOrderStatusLogic(orderId, status);
        res.json({ message: 'Order status updated successfully' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// Fix 17: Xóa hàm changeOrderStatus trùng với updateOrderStatus —
// Route admin dùng updateOrderStatus (id từ params), đây là alias tương thích
export const changeOrderStatus = updateOrderStatus;

export const approveReturn = async (req: Request, res: Response): Promise<void> => {
    const orderId = Number(req.params.id);
    try {
        await prisma.$transaction(async (tx) => {
            const existing = await tx.returnRequest.findUnique({
                where: { order_id: orderId },
                include: {
                    items: {
                        include: { order_item: true }
                    }
                }
            });
            if (existing) {
                await tx.returnRequest.update({
                    where: { order_id: orderId },
                    data: { status: 'Approved', admin_response: 'Approved' }
                });
            } else {
                await tx.returnRequest.create({
                    data: {
                        order_id: orderId,
                        reason_code: 'Admin Approval',
                        description: 'Manually approved by admin',
                        status: 'Approved',
                        admin_response: 'Approved'
                    }
                });
            }

            // ─── Partial Stock Restore ────────────────────────────────────────────
            // Nếu có ReturnRequestItems → chỉ restore stock cho các item được trả
            // Nếu không có (đơn cũ / manual approve) → restore toàn bộ như cũ
            if (existing?.items && existing.items.length > 0) {
                for (const retItem of existing.items) {
                    const sizeId = retItem.order_item.size_id;
                    if (!sizeId) continue;
                    await tx.productSize.update({
                        where: { id: sizeId },
                        data: { stock: { increment: retItem.return_quantity } }
                    });
                }
            }
            // (Nếu không có items → changeOrderStatusLogic sẽ xử lý restore toàn bộ)
        });

        // ─── Status + Revenue/Spending Update ────────────────────────────────────
        // Lấy refund_amount từ ReturnRequest để cập nhật revenue & spending chính xác
        const returnReq = await prisma.returnRequest.findUnique({
            where: { order_id: orderId },
            include: { items: true }
        });
        const refundAmount = returnReq ? Number(returnReq.refund_amount) : null;

        // Nếu có ReturnRequestItems (partial return) → cập nhật revenue/spending thủ công
        // thay vì để changeOrderStatusLogic trừ toàn bộ total_price
        if (refundAmount !== null && returnReq?.items && returnReq.items.length > 0) {
            // Chạy changeOrderStatusLogic nhưng với flag để bỏ qua stock restore (đã làm ở trên)
            // và bỏ qua revenue update (sẽ tự làm dưới)
            await prisma.$transaction(async (tx) => {
                const order = await tx.order.findUnique({ where: { id: orderId } });
                if (!order) return;

                // Update order status
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: 'Return_Approved' }
                });

                // Revenue & Spending: chỉ trừ refund_amount (không phải toàn bộ total_price)
                if (order.user_id && refundAmount > 0) {
                    const currentUser = await tx.user.findUnique({ where: { id: order.user_id } });
                    if (currentUser) {
                        const newTotalSpent = Math.max(0, Number(currentUser.total_spent) - refundAmount);
                        await tx.user.update({
                            where: { id: order.user_id },
                            data: { total_spent: newTotalSpent }
                        });
                        const tier = await tx.membership.findFirst({
                            where: { min_spending: { lte: newTotalSpent } },
                            orderBy: { min_spending: 'desc' }
                        });
                        if (tier) {
                            await tx.user.update({
                                where: { id: order.user_id },
                                data: { membership_id: tier.id }
                            });
                        }
                    }
                }

                // Revenue: trừ refundAmount trên ngày giao hàng gốc
                if (refundAmount > 0) {
                    const revenueDate = order.delivered_at ? new Date(order.delivered_at) : new Date();
                    revenueDate.setHours(0, 0, 0, 0);
                    const existingRevenue = await tx.revenue.findUnique({ where: { report_date: revenueDate } });
                    if (existingRevenue) {
                        await tx.revenue.update({
                            where: { report_date: revenueDate },
                            data: {
                                total_sales: { increment: -refundAmount },
                                total_orders: { increment: 0 } // Partial return không trừ order count
                            }
                        });
                    }
                }
            });
        } else {
            // Backward-compatible: manual approve hoặc full return → dùng logic cũ
            await changeOrderStatusLogic(orderId, 'Return_Approved');
        }

        res.status(200).json({ message: "Return request approved successfully!" });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message || "Server Error" });
    }
};

export const rejectReturn = async (req: Request, res: Response): Promise<void> => {
    const orderId = Number(req.params.id);
    const { adminNote } = req.body;
    try {
        await prisma.$transaction(async (tx) => {
            const existing = await tx.returnRequest.findUnique({ where: { order_id: orderId } });
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
        });
        await changeOrderStatusLogic(orderId, 'Return_Rejected');
        res.status(200).json({ message: "Return request rejected successfully." });
    } catch (err: any) {
        res.status(500).json({ message: "Failed to reject return request", error: err.message });
    }
};
