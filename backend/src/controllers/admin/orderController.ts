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
                    return_request: true,
                    items: {
                        include: {
                            product: { select: { name: true, image_url: true } },
                            color: { select: { color_name: true } },
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
                image_url: item.product?.image_url,
                color_name: item.color?.color_name,
                size: item.size?.size
            }));

            return {
                ...order,
                user_name: order.user?.name || order.name,
                user_email: order.user?.email || order.email,
                reason_code: rr?.reason_code,
                description: rr?.description,
                refund_bank_info: bankInfo,
                return_images: returnImages,
                return_status: rr?.status,
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

// Complex status change handling inventory and revenue
export const changeOrderStatusLogic = async (orderId: number, newStatus: string) => {
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
        const newIsInactive = inactiveSet.has(newStatus as any);

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

        if (oldStatus !== "Delivered" && newStatus === "Delivered") {
            revenueChange = totalPrice;
            orderCountChange = 1;
            deliveredAtUpdate = new Date(); // Fix 7: ghi lại thời điểm giao hàng
        } else if ((newStatus === "Return_Approved" || newStatus === "Cancelled") && oldStatus === "Delivered") {
            revenueChange = -totalPrice;
            orderCountChange = -1;
        } else if (oldStatus === "Delivered" && newStatus !== "Delivered") {
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
            if (newStatus === "Delivered") {
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
        const updateData: any = { status: newStatus as any };
        if (deliveredAtUpdate) updateData.delivered_at = deliveredAtUpdate; // Fix 7

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
        await changeOrderStatusLogic(Number(id), status);
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
            await tx.returnRequest.update({
                where: { order_id: orderId },
                data: { status: 'Approved', admin_response: 'Refunded' }
            });
        });
        await changeOrderStatusLogic(orderId, 'Return_Approved');
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
            await tx.returnRequest.update({
                where: { order_id: orderId },
                data: { status: 'Rejected', admin_response: adminNote }
            });
        });
        await changeOrderStatusLogic(orderId, 'Return_Rejected');
        res.status(200).json({ message: "Return request rejected successfully." });
    } catch (err: any) {
        res.status(500).json({ message: "Failed to reject return request", error: err.message });
    }
};
