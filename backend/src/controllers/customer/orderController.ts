import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../../../prisma/client';
import { queueEmail } from '../../utils/emailQueue';
import { sendNotification } from '../../utils/socket';
import { recordInteraction } from '../../services/interactionService';
import { allocateItemDiscounts } from '../../services/discountAllocationService';
import { changeOrderStatusLogic } from '../../services/orderStatusService';
import { validateAndReserveItems, applyMembershipDiscount, applyVoucherDiscount, MinimumOrderValueError, OrderCreationError } from '../../services/orderCreationService';
import { toVnd } from '../../utils/pricing';
import { formatOrderResponse } from '../../utils/formatOrder';
import { generateVnPayUrl } from '../../utils/vnpayService';
import { getMomoPayUrl } from '../../utils/momoService';
import { calculateShippingFee, extractProvince } from '../../utils/shippingUtils';
import type { OrderRequestItem } from '../../types/orderTypes';
import type { PaymentMethod } from '../../generated/prisma/enums';

// Giữ export cũ để routes/tests đang import từ file này không vỡ.
export { sendOtpController, verifyOtpAndGetOrders } from './orderLookupController';
export { momoCallback, momoReturn, vnpayIpn, vnpayReturn, repayMoMoController } from './paymentController';
export { submitReturnRequest, cancelReturnRequest } from './returnController';

export const createOrderController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id || null;
        const { address, items, phone, name, email, payment_method, voucher_id } = req.body;

        if (!address || !items || items.length === 0) {
            res.status(400).json({ message: "Invalid order data: Address or items are missing" });
            return;
        }

        // Validate that an email is available for order confirmation
        const orderEmail = email || (req.user ? req.user.email : '');
        if (!orderEmail || typeof orderEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderEmail)) {
            res.status(400).json({ message: "A valid email address is required to place an order." });
            return;
        }

        const normalizedPaymentMethod = String(payment_method || 'cod').toLowerCase();
        const allowedPaymentMethods = new Set(['cod', 'momo', 'vnpay']);
        if (!allowedPaymentMethods.has(normalizedPaymentMethod)) {
            res.status(400).json({
                message: "Invalid payment method. Allowed values: cod, momo, vnpay."
            });
            return;
        }

        let orderId = 0;
        let finalTotal = 0;

        await prisma.$transaction(async (tx) => {
            // 1. Validate items, calculate prices, deduct stock atomically
            const { itemsToSave, serverCalculatedTotal, blockedProductIds } = await validateAndReserveItems(tx, items);

            // 2. Apply membership discount
            const { totalMembershipDiscount, userMembershipPercent } = await applyMembershipDiscount(tx, userId, itemsToSave, blockedProductIds);
            finalTotal = Math.max(0, toVnd(serverCalculatedTotal - totalMembershipDiscount));

            // 3. Apply voucher discount (tính trên từng dòng hàng sau khi trừ membership)
            const { totalVoucherDiscount, eligibleProductIds } = await applyVoucherDiscount(tx, voucher_id, itemsToSave, userMembershipPercent, blockedProductIds);
            finalTotal = Math.max(0, toVnd(finalTotal - totalVoucherDiscount));
            const itemAllocations = allocateItemDiscounts(itemsToSave, {
                membershipDiscount: totalMembershipDiscount,
                voucherDiscount: totalVoucherDiscount,
                eligibleProductIds,
                payableTotal: finalTotal
            });

            itemsToSave.forEach((item, index) => {
                item.discount_amount = itemAllocations[index].discount_amount;
                item.payable_amount = itemAllocations[index].payable_amount;
            });

            // 4. Calculate shipping fee entirely on the server.
            // Never trust the client-provided shipping_fee: it can be tampered with.
            // Keep the calculation in sync with frontend/src/utils/shippingUtils.ts.
            const province = extractProvince(address);
            const totalQty = itemsToSave
                .filter(i => !i.is_gift)
                .reduce((sum: number, i: { quantity: number }) => sum + Number(i.quantity), 0);
            const serverShippingFee = calculateShippingFee(province, totalQty, finalTotal);

            if (serverShippingFee === null) {
                throw new OrderCreationError(400, 'Unable to calculate shipping fee: province is missing.');
            }

            finalTotal = Math.max(0, toVnd(finalTotal + serverShippingFee));

            // 5. Create Order
            const newOrder = await tx.order.create({
                data: {
                    user_id: userId,
                    voucher_id: voucher_id ? Number(voucher_id) : null,
                    name: name || (req.user ? req.user.name : 'Khách hàng'),
                    email: orderEmail,
                    phone: phone || '',
                    address,
                    total_price: finalTotal,
                    shipping_fee: serverShippingFee,
                    membership_discount: totalMembershipDiscount,
                    voucher_discount: totalVoucherDiscount,
                    payment_method: normalizedPaymentMethod as PaymentMethod,
                    items: { create: itemsToSave }
                }
            });
            orderId = newOrder.id;
        }, { maxWait: 10000, timeout: 30000 });

        let guestOrderAccessToken: string | undefined;
        if (!userId) {
            const secret = process.env.JWT_SECRET;
            if (secret) {
                guestOrderAccessToken = jwt.sign(
                    { purpose: 'guest-order-access', email: orderEmail.toLowerCase() },
                    secret,
                    { expiresIn: '15m' }
                );
            }
        }

        const lang = (req.headers['accept-language'] || req.headers['language'] || 'vi') as string;
        const isEnglish = lang.startsWith('en');
        const emailLang = isEnglish ? 'en' : 'vi';

        // Outside transaction: Emails, Analytics, MoMo
        queueEmail(
            orderEmail,
            isEnglish ? "Order Confirmation" : "Xác nhận đơn hàng",
            isEnglish
                ? `Thank you! Order #${orderId} has been placed successfully. Total: ${finalTotal.toLocaleString()} VND`
                : `Cảm ơn bạn! Đơn hàng #${orderId} đã được đặt thành công. Tổng cộng: ${finalTotal.toLocaleString()} VNĐ`,
            emailLang
        );

        // Emit realtime notification to Admin
        try {
            await sendNotification(prisma, null, 'Đơn hàng mới', `Khách hàng ${name} vừa đặt đơn hàng #${orderId}`, 'New Order', `Customer ${name} just placed order #${orderId}`, 'new_order', { orderId, total: finalTotal, customerName: name });
        } catch(e) {
            console.error('Socket emit error:', e);
        }

        if (userId) {
            items.forEach((item: OrderRequestItem) => recordInteraction(userId, Number(item.product_id), 'purchase'));
        }

        if (normalizedPaymentMethod === "momo") {
            try {
                const momoResponse = await getMomoPayUrl(orderId.toString(), finalTotal, `Payment for order #${orderId}`);
                if (!momoResponse || !momoResponse.payUrl) {
                    throw new Error(momoResponse?.message || "Failed to get MoMo payUrl");
                }
                res.status(201).json({ message: "Redirecting to MoMo", orderId, payUrl: momoResponse.payUrl, guestOrderAccessToken });
                return;
            } catch (momoError) {
                console.error("MoMo API Error:", momoError);
                res.status(201).json({
                    message: "Order created but MoMo payment link failed. Please retry payment in your profile.",
                    orderId, payUrl: null, guestOrderAccessToken
                });
                return;
            }
        }

        if (normalizedPaymentMethod === "vnpay") {
            try {
                const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
                const vnpayUrl = generateVnPayUrl({
                    orderId: orderId.toString(),
                    amount: finalTotal,
                    orderInfo: `Thanh toan don hang #${orderId}`,
                    ipAddr: clientIp,
                    bankCode: 'VNBANK',
                });
                res.status(201).json({ message: "Redirecting to VNPay", orderId, payUrl: vnpayUrl, guestOrderAccessToken });
                return;
            } catch (vnpError: unknown) {
                console.error("VNPay API Error:", vnpError);
                res.status(201).json({
                    message: "Order created but VNPay payment link failed. Please retry payment in your profile.",
                    orderId, payUrl: null, guestOrderAccessToken
                });
                return;
            }
        }

        res.status(201).json({ message: "Order placed successfully (COD)", orderId, total: finalTotal, payUrl: null, guestOrderAccessToken });

    } catch (error: unknown) {
        console.error("Order creation failed:", error instanceof Error ? error.message : String(error));

        // Lỗi nghiệp vụ có dữ liệu (VD: voucher min order value) → trả 400 + dữ liệu để frontend dịch
        if (error instanceof MinimumOrderValueError) {
            res.status(400).json({
                message: "Minimum order value not met",
                min_order_value: error.min_order_value
            });
            return;
        }
        if (error instanceof OrderCreationError) {
            res.status(error.httpStatus).json({ message: error.message });
            return;
        }
        // Do not expose internal exception details to clients; they may contain SQL/provider data.
        res.status(500).json({ message: "Failed to create order" });
    }
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const orders = await prisma.order.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            include: {
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
                voucher: {
                    select: { id: true, code: true, discount_percent: true, max_discount_amount: true }
                },
                items: {
                    include: {
                        promotion: { select: { id: true, buy_product_id: true, gift_product_id: true, buy_quantity: true, gift_quantity: true } },
                        product: { select: { name: true, name_vi: true, name_en: true, image_url: true } },
                        color: { select: { color_name: true, color_name_vi: true, color_name_en: true, image_url: true } },
                        size: { select: { size: true } }
                    }
                }
            }
        });

        const formattedOrders = orders.map(formatOrderResponse);

        res.json(formattedOrders);
    } catch (error) {
        console.error("Get orders error:", error);
        res.status(500).json({ message: "Error fetching order list" });
    }
};

// Customer chỉ được cancel đơn của chính mình, khi đang Pending/Confirmed
export const changeOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { order_id, new_status } = req.body;

        const order = await prisma.order.findUnique({ where: { id: Number(order_id) } });
        if (!order) {
            res.status(404).json({ message: "Order not found." });
            return;
        }

        // Kiểm tra ownership (cho phép Admin bypass):
        const isAdmin = req.user?.role === 'admin';
        if (order.user_id) {
            if (!isAdmin && (!req.user || req.user.id !== order.user_id)) {
                res.status(403).json({ message: "Forbidden: This order does not belong to you." });
                return;
            }
        } else {
            if (!isAdmin && (!req.guestOrderEmail || order.email.toLowerCase() !== req.guestOrderEmail)) {
                res.status(403).json({ message: "Forbidden: Verify the guest order by OTP before changing it." });
                return;
            }
        }

        // Customer chỉ được Cancel, và chỉ khi đơn chưa ship
        const allowedCustomerStatuses = ['Cancelled'];
        const cancellableFrom = ['Pending', 'Confirmed'];
        if (!allowedCustomerStatuses.includes(new_status)) {
            res.status(403).json({ message: "You are not allowed to set this order status." });
            return;
        }
        if (!cancellableFrom.includes(order.status)) {
            res.status(400).json({ message: `Cannot cancel an order that is already "${order.status}".` });
            return;
        }

        await changeOrderStatusLogic(Number(order_id), new_status);

        // Payment_status transition (Paid → Refunded) is now handled
        // atomically inside changeOrderStatusLogic (orderStatusService.ts L167-169).
        // The previous code here did a redundant update OUTSIDE the transaction,
        // which could race with the in-transaction update or double-write.
        // Read the current payment_status after the transaction to report it back.
        const updatedOrder = await prisma.order.findUnique({
            where: { id: Number(order_id) },
            select: { payment_status: true },
        });
        const finalPaymentStatus = updatedOrder?.payment_status ?? order.payment_status;

        // Emit realtime socket event to Admin
        try {
            await sendNotification(prisma, null, 'Đơn hàng bị hủy', `Đơn hàng #${order_id} đã bị hủy`, 'Order Cancelled', `Order #${order_id} has been cancelled`, 'order_cancelled', { orderId: Number(order_id), customerName: order.name || `#${order_id}`, isPaid: order.payment_status === 'Paid' });
        } catch (e) {
            console.error('Socket emit error (order_cancelled):', e);
        }

        res.json({ message: "Order cancelled successfully!", payment_status: finalPaymentStatus });
    } catch (err: unknown) {
        res.status(500).json({ message: "Failed to update order status", error: err instanceof Error ? err.message : String(err) });
    }
};
