import { Request, Response } from 'express';
import prisma from '../../../prisma/client';
import { Prisma } from '@prisma/client';

export const getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const orders = await prisma.order.findMany({
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
        });

        const processedOrders = orders.map(order => {
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

        res.json(processedOrders);
    } catch (err) {
        console.error("getOrders admin error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { payment_status } = req.body;

    try {
        const order = await prisma.order.update({
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
        const inactiveStatuses = ["Cancelled", "Return Approved", "Return Rejected", "Return Requested"]; // Note: Adjusted based on enum
        const inactiveSet = new Set(["Cancelled", "Return_Approved"]); // Map to Prisma enums
        
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
                    // Deduct stock (e.g. Cancelled -> Pending)
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
        let paymentStatusUpdate: any = undefined;

        if (oldStatus !== "Delivered" && newStatus === "Delivered") {
            revenueChange = totalPrice;
            orderCountChange = 1;
            paymentStatusUpdate = 'Paid';
        } else if ((newStatus === "Return_Approved" || newStatus === "Cancelled") && oldStatus === "Delivered") {
            revenueChange = -totalPrice;
            orderCountChange = -1;
            paymentStatusUpdate = 'Refunded';
        } else if (oldStatus === "Delivered" && newStatus !== "Delivered") {
            revenueChange = -totalPrice;
            orderCountChange = -1;
        } else if (newStatus === "Return_Approved") {
            paymentStatusUpdate = 'Refunded';
        }

        // Update User Spending and Membership
        if (revenueChange !== 0 && userId) {
            await tx.user.update({
                where: { id: userId },
                data: { total_spent: { increment: revenueChange } }
            });

            const updatedUser = await tx.user.findUnique({ where: { id: userId } });
            if (updatedUser) {
                const tier = await tx.membership.findFirst({
                    where: { min_spending: { lte: updatedUser.total_spent } },
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

        // Update Daily Revenues
        if (revenueChange !== 0 || orderCountChange !== 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const existingRevenue = await tx.revenue.findUnique({
                where: { report_date: today }
            });

            if (existingRevenue) {
                await tx.revenue.update({
                    where: { report_date: today },
                    data: {
                        total_sales: { increment: revenueChange },
                        total_orders: { increment: orderCountChange }
                    }
                });
            } else {
                await tx.revenue.create({
                    data: {
                        report_date: today,
                        total_sales: revenueChange,
                        total_orders: orderCountChange
                    }
                });
            }
        }

        // 3. Update Order
        const updateData: any = { status: newStatus as any };
        if (paymentStatusUpdate) {
            updateData.payment_status = paymentStatusUpdate;
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
        await changeOrderStatusLogic(Number(id), status);
        res.json({ message: 'Order status updated successfully' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

export const changeOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { order_id, new_status } = req.body;
        await changeOrderStatusLogic(Number(order_id), new_status);
        res.json({ message: "Order status updated successfully!" });
    } catch (err: any) {
        res.status(500).json({ message: "Failed to update order status", error: err.message });
    }
};

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
