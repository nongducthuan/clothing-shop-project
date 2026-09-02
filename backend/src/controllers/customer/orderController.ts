import { Request, Response } from 'express';
import prisma from '../../../prisma/client';
import { sendEmail } from '../../utils/emailService';
import { recordInteraction } from '../../services/interactionService';
import https from 'https';
import crypto from 'crypto';
import { changeOrderStatusLogic } from '../admin/orderController';

const ENUM_TO_DISPLAY_STATUS: Record<string, string> = {
    "Return_Requested": "Return Requested",
    "Return_Rejected":  "Return Rejected",
    "Return_Approved":  "Return Approved",
};

// ─── OTP ──────────────────────────────────────────────────────────────────────

export const sendOtpController = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
    }

    try {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const recentOtp = await prisma.otp.findFirst({
            where: { email, created_at: { gte: oneMinuteAgo } }
        });

        if (recentOtp) {
            res.status(429).json({ message: "Please wait 1 minute before requesting a new OTP code." });
            return;
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.$transaction(async (tx) => {
            await tx.otp.deleteMany({ where: { email } });
            await tx.otp.create({
                data: { email, code, expires_at: expiresAt }
            });
        });

        const emailResult = await sendEmail(email, "Your OTP Code", `Your verification code is: ${code}`);
        if (!emailResult.success) {
            res.status(500).json({ message: "Failed to send OTP email: " + emailResult.error });
            return;
        }
        res.json({ message: "OTP sent to your email successfully" });
    } catch (err) {
        console.error("Send OTP Error:", err);
        res.status(500).json({ message: "Server error while sending OTP" });
    }
};

export const verifyOtpAndGetOrders = async (req: Request, res: Response): Promise<void> => {
    const { email, code } = req.body;

    try {
        const otpData = await prisma.otp.findFirst({
            where: { email }
        });

        if (!otpData) {
            res.status(400).json({ message: "Invalid OTP code!" });
            return;
        }

        // Fix 14: Giới hạn số lần thử sai để chống brute-force
        const MAX_ATTEMPTS = 5;
        if (otpData.failed_attempts >= MAX_ATTEMPTS) {
            await prisma.otp.deleteMany({ where: { email } });
            res.status(429).json({ message: "Too many failed attempts. Please request a new OTP." });
            return;
        }

        if (new Date() > new Date(otpData.expires_at)) {
            await prisma.otp.deleteMany({ where: { email } });
            res.status(400).json({ message: "OTP code has expired!" });
            return;
        }

        if (otpData.code !== code) {
            // Tăng failed_attempts
            await prisma.otp.update({
                where: { id: otpData.id },
                data: { failed_attempts: { increment: 1 } }
            });
            const remaining = MAX_ATTEMPTS - otpData.failed_attempts - 1;
            res.status(400).json({ message: `Invalid OTP code! ${remaining} attempt(s) remaining.` });
            return;
        }

        const orders = await prisma.order.findMany({
            where: { email },
            orderBy: { created_at: 'desc' },
            include: {
                return_request: { select: { id: true, status: true } },
                items: {
                    include: {
                        product: { select: { name: true, image_url: true } },
                        color: { select: { color_name: true, image_url: true } },
                        size: { select: { size: true } }
                    }
                }
            }
        });

        const formattedOrders = orders.map(order => ({
            id: order.id,
            email: order.email,
            name: order.name,
            phone: order.phone,
            address: order.address,
            total_price: Number(order.total_price),
            status: ENUM_TO_DISPLAY_STATUS[order.status] || order.status,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
            created_at: order.created_at,
            return_request: order.return_request ?? null,
            items: order.items.map(item => ({
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: Number(item.price),
                is_gift: item.is_gift,
                product_name: item.product?.name ?? null,
                image_url: item.color?.image_url || item.product?.image_url || null,
                color: item.color?.color_name ?? null,
                color_name: item.color?.color_name ?? null,
                size: item.size?.size ?? null,
            }))
        }));

        await prisma.otp.deleteMany({ where: { email } });
        res.json({ message: "Verification successful", orders: formattedOrders });
    } catch (err) {
        console.error("Order verification error:", err);
        res.status(500).json({ message: "System error while fetching orders" });
    }
};

// ─── MoMo ─────────────────────────────────────────────────────────────────────

async function getMomoPayUrl(orderId: string, amountInput: number | string, orderInfo: string): Promise<any> {
    const partnerCode = process.env.MOMO_PARTNER_CODE || '';
    const accessKey = process.env.MOMO_ACCESS_KEY || '';
    const secretKey = process.env.MOMO_SECRET_KEY || '';

    const amountNumber = Math.round(Number(amountInput));
    const amountString = amountNumber.toString();
    const requestId = `${orderId}_${Date.now()}`;
    const momoOrderId = requestId;
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile`;
    // Ensure we handle BACKEND_URL whether it has a trailing slash or includes /api already
    const baseUrl = process.env.BACKEND_URL?.replace(/\/+$/, '').replace(/\/api$/, '') || 'http://localhost:5000';
    const ipnUrl = `${baseUrl}/api/orders/momo-callback`;
    const requestType = "payWithATM";
    const extraData = "";

    const rawSignature = `accessKey=${accessKey}&amount=${amountString}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const requestBody = JSON.stringify({
        partnerCode, accessKey, requestId, amount: amountNumber,
        orderId: momoOrderId, orderInfo, redirectUrl, ipnUrl,
        extraData, requestType, signature, lang: 'en'
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'test-payment.momo.vn',
            port: 443,
            path: '/v2/gateway/api/create',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve({ errorCode: -1, message: "Error parsing MoMo response" }); }
            });
        });

        req.on('error', e => reject(e));
        req.write(requestBody);
        req.end();
    });
}

// ─── ORDER CREATION ───────────────────────────────────────────────────────────

export const createOrderController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id || null;
        const { address, items, phone, name, email, payment_method, voucher_id } = req.body;

        if (!address || !items || items.length === 0) {
            res.status(400).json({ message: "Invalid order data: Address or items are missing" });
            return;
        }

        let orderId = 0;
        let finalTotal = 0;

        await prisma.$transaction(async (tx) => {
            let serverCalculatedTotal = 0;
            const itemsToSave: any[] = [];

            // 1. Calculate price, check stock, validate size selection
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: Number(item.product_id) },
                    include: { colors: { include: { sizes: true } } }
                });
                if (!product) throw new Error(`Product not found`);

                // Fix 13: Validate size bắt buộc nếu sản phẩm có size
                const isGift = item.is_gift === true;
                const hasSizes = product.colors.some(c => c.sizes.length > 0);
                if (hasSizes && !item.size_id && !isGift) {
                    throw new Error(`Please select a size for product "${product.name}"`);
                }

                // Fix 10: status: true (Boolean) thay vì status: 1
                const sales = await tx.sale.findMany({
                    where: {
                        status: true,
                        start_date: { lte: new Date() },
                        end_date: { gte: new Date() },
                        OR: [
                            { apply_scope: 'all' },
                            { product_sales: { some: { product_id: product.id } } },
                            { sale_categories: { some: { category_id: product.category_id } } }
                        ]
                    },
                    orderBy: { discount_percent: 'desc' },
                    take: 1
                });

                let finalItemPrice = 0;
                if (!isGift) {
                    const discount = sales.length > 0 ? Number(sales[0].discount_percent) : 0;
                    finalItemPrice = Number(product.price) * (1 - discount / 100);
                    serverCalculatedTotal += finalItemPrice * item.quantity;
                }

                if (item.size_id) {
                    const size = await tx.productSize.findUnique({ where: { id: Number(item.size_id) } });
                    if (!size || size.stock < item.quantity) {
                        throw new Error(`Insufficient stock for product "${product.name}" (size_id=${item.size_id})`);
                    }
                    // FIX RACE CONDITION: Sử dụng Atomic Update để trừ kho
                    const updateResult = await tx.productSize.updateMany({
                        where: { 
                            id: Number(item.size_id),
                            stock: { gte: item.quantity } // Phải đảm bảo còn đủ hàng lúc update
                        },
                        data: { stock: { decrement: item.quantity } }
                    });

                    if (updateResult.count === 0) {
                        throw new Error(`Out of stock for product "${product.name}" due to high traffic!`);
                    }
                }

                itemsToSave.push({
                    product_id: Number(item.product_id),
                    color_id: item.color_id ? Number(item.color_id) : null,
                    size_id: item.size_id ? Number(item.size_id) : null,
                    quantity: Number(item.quantity),
                    price: finalItemPrice,
                    is_gift: isGift,
                    promotion_id: item.promotion_id ? Number(item.promotion_id) : null
                });
            }

            // 2. Membership Discount
            if (userId) {
                const user = await tx.user.findUnique({
                    where: { id: userId },
                    include: { membership: true }
                });
                if (user?.membership && Number(user.membership.discount_percent) > 0) {
                    const discount = (serverCalculatedTotal * Number(user.membership.discount_percent)) / 100;
                    serverCalculatedTotal -= discount;
                }
            }

            finalTotal = serverCalculatedTotal;

            // Fix 8 + Fix 9: Re-validate voucher, tính discount trên eligible items
            if (voucher_id) {
                const voucher = await tx.voucher.findUnique({
                    where: { id: Number(voucher_id) },
                    include: { product_vouchers: true, voucher_categories: true }
                });

                if (!voucher || !voucher.status) {
                    throw new Error('Voucher does not exist or has been disabled.');
                }
                if (voucher.usage_limit !== null && voucher.usage_limit <= 0) {
                    throw new Error('Voucher usage limit reached.');
                }
                if (voucher.start_date && new Date() < voucher.start_date) {
                    throw new Error('Voucher is not active yet.');
                }
                if (voucher.end_date && new Date() > voucher.end_date) {
                    throw new Error('Voucher has expired.');
                }
                if (finalTotal < Number(voucher.min_order_value)) {
                    throw new Error(`Minimum order value of ${Number(voucher.min_order_value).toLocaleString()}đ not met.`);
                }

                // Fix 9: Tính discount chỉ trên phần eligible items (đồng bộ với applyVoucherCustomer)
                let eligibleTotal = 0;
                const nonGiftItems = itemsToSave.filter(i => !i.is_gift);

                if (voucher.apply_scope === 'all') {
                    eligibleTotal = finalTotal;
                } else if (voucher.apply_scope === 'product') {
                    const allowedIds = voucher.product_vouchers.map(pv => pv.product_id);
                    eligibleTotal = nonGiftItems
                        .filter(i => allowedIds.includes(i.product_id))
                        .reduce((sum, i) => sum + (i.price * i.quantity), 0);
                } else if (voucher.apply_scope === 'category') {
                    const allowedCatIds = voucher.voucher_categories.map(vc => vc.category_id);
                    const products = await tx.product.findMany({
                        where: { id: { in: nonGiftItems.map(i => i.product_id) } },
                        select: { id: true, category_id: true }
                    });
                    const eligibleProductIds = products
                        .filter(p => allowedCatIds.includes(p.category_id))
                        .map(p => p.id);
                    eligibleTotal = nonGiftItems
                        .filter(i => eligibleProductIds.includes(i.product_id))
                        .reduce((sum, i) => sum + (i.price * i.quantity), 0);
                }

                if (eligibleTotal === 0) {
                    throw new Error('Voucher is not applicable to any products in this order.');
                }

                let voucherDiscount = (eligibleTotal * Number(voucher.discount_percent || 0)) / 100;
                if (voucher.max_discount_amount && voucherDiscount > Number(voucher.max_discount_amount)) {
                    voucherDiscount = Number(voucher.max_discount_amount);
                }
                finalTotal = Math.max(0, finalTotal - voucherDiscount);

                // FIX RACE CONDITION: Atomic update cho Voucher limit
                if (voucher.usage_limit !== null) {
                    const voucherUpdateResult = await tx.voucher.updateMany({
                        where: { 
                            id: Number(voucher_id),
                            usage_limit: { gte: 1 } 
                        },
                        data: {
                            usage_limit: { decrement: 1 },
                            used_count: { increment: 1 }
                        }
                    });
                    if (voucherUpdateResult.count === 0) {
                        throw new Error('Voucher was just fully consumed by other users.');
                    }
                } else {
                    await tx.voucher.update({
                        where: { id: Number(voucher_id) },
                        data: { used_count: { increment: 1 } }
                    });
                }
            }

            // 3. Create Order
            const newOrder = await tx.order.create({
                data: {
                    user_id: userId,
                    voucher_id: voucher_id ? Number(voucher_id) : null,
                    name,
                    email,
                    phone,
                    address,
                    total_price: finalTotal,
                    payment_method: payment_method || 'cod',
                    items: { create: itemsToSave }
                }
            });
            orderId = newOrder.id;
        });

        // Outside transaction: Emails, Analytics, MoMo
        sendEmail(
            email || (req.user ? req.user.email : ''),
            "Order Confirmation",
            `Thank you! Order #${orderId} has been placed successfully. Total: ${finalTotal.toLocaleString()} VND`
        ).catch(e => console.error("Email error:", e));

        if (userId) {
            items.forEach((item: any) => recordInteraction(userId, item.product_id, 'purchase'));
        }

        if (payment_method === "momo") {
            try {
                const momoResponse = await getMomoPayUrl(orderId.toString(), finalTotal, `Payment for order #${orderId}`);
                res.status(201).json({ message: "Redirecting to MoMo", orderId, payUrl: momoResponse.payUrl });
                return;
            } catch (momoError) {
                console.error("MoMo API Error:", momoError);
                res.status(201).json({
                    message: "Order created but MoMo payment link failed. Please retry payment in your profile.",
                    orderId, payUrl: null
                });
                return;
            }
        }

        res.status(201).json({ message: "Order placed successfully (COD)", orderId, total: finalTotal, payUrl: null });

    } catch (error: any) {
        console.error("Order creation failed:", error.message);
        res.status(500).json({ message: "Failed to create order", error: error.message });
    }
};

// ─── GET ORDERS ───────────────────────────────────────────────────────────────

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
                return_request: { select: { id: true, status: true } },
                items: {
                    include: {
                        product: { select: { name: true, image_url: true } },
                        color: { select: { color_name: true, image_url: true } },
                        size: { select: { size: true } }
                    }
                }
            }
        });

        const formattedOrders = orders.map(order => ({
            id: order.id,
            name: order.name,
            email: order.email,
            phone: order.phone,
            address: order.address,
            total_price: Number(order.total_price),
            status: ENUM_TO_DISPLAY_STATUS[order.status] || order.status,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
            created_at: order.created_at,
            return_request: order.return_request ?? null,
            items: order.items.map(item => ({
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: Number(item.price),
                is_gift: item.is_gift,
                product_name: item.product?.name ?? null,
                image_url: item.color?.image_url || item.product?.image_url || null,
                color: item.color?.color_name ?? null,
                color_name: item.color?.color_name ?? null,
                size: item.size?.size ?? null,
            }))
        }));

        res.json(formattedOrders);
    } catch (error) {
        console.error("Get orders error:", error);
        res.status(500).json({ message: "Error fetching order list" });
    }
};

// ─── CUSTOMER CHANGE ORDER STATUS ─────────────────────────────────────────────

// Fix 3: Customer chỉ được cancel đơn của chính mình, khi đang Pending/Confirmed
export const changeOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { order_id, new_status, email } = req.body;

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
            if (!isAdmin && (!email || order.email !== email)) {
                res.status(403).json({ message: "Forbidden: Email does not match the guest order." });
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
        res.json({ message: "Order cancelled successfully!" });
    } catch (err: any) {
        res.status(500).json({ message: "Failed to update order status", error: err.message });
    }
};

// ─── MOMO CALLBACK ────────────────────────────────────────────────────────────

// Fix 2: Verify HMAC signature từ MoMo trước khi xử lý
export const momoCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            partnerCode, orderId, requestId, amount, orderInfo,
            orderType, transId, resultCode, message, payType,
            responseTime, extraData, signature
        } = req.body;

        const secretKey = process.env.MOMO_SECRET_KEY || '';
        const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
        const expectedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

        if (signature !== expectedSignature) {
            console.warn(`MoMo IPN: Invalid signature for orderId=${orderId}`);
            res.status(400).json({ message: "Invalid signature" });
            return;
        }

        if (resultCode === 0) {
            const parts = orderId.split('_');
            const realOrderId = orderId.startsWith('REPAY') ? Number(parts[1]) : Number(parts[0]);

            await prisma.order.update({
                where: { id: realOrderId },
                data: { payment_status: 'Paid' }
            });

            try {
                await changeOrderStatusLogic(realOrderId, 'Confirmed');
            } catch (orderError: any) {
                console.error("Order Status Update Error (IPN):", orderError.message);
            }
        }
        res.status(204).send();
    } catch (error: any) {
        console.error("FULL IPN ERROR LOG:", error);
        res.status(500).json({ message: "IPN Webhook Error", error: error.message });
    }
};

// ─── REPAY MOMO ───────────────────────────────────────────────────────────────

// Fix 4: Sửa auth logic – không cho bypass JWT bằng email
export const repayMoMoController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { email } = req.body;

        const order = await prisma.order.findUnique({ where: { id: Number(id) } });
        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }

        // Kiểm tra ownership đúng cách (Cho phép Admin bypass)
        const isAdmin = req.user?.role === 'admin';
        if (order.user_id) {
            // Đơn hàng của member → phải có JWT và khớp user_id (hoặc là Admin)
            if (!isAdmin && (!req.user || req.user.id !== order.user_id)) {
                res.status(403).json({ message: "Forbidden: You do not have permission to pay for this order." });
                return;
            }
        } else {
            // Đơn hàng của guest → phải cung cấp email khớp (hoặc là Admin)
            if (!isAdmin && (!email || order.email !== email)) {
                res.status(403).json({ message: "Forbidden: Email does not match the order." });
                return;
            }
        }

        if (order.payment_method !== 'momo' || order.payment_status === 'Paid') {
            res.status(400).json({ message: "This order cannot be repaid or is already paid." });
            return;
        }

        const momoOrderId = `REPAY_${order.id}_${Date.now()}`;
        const momoResponse = await getMomoPayUrl(momoOrderId, Number(order.total_price), `Retry payment for order #${order.id}`);

        res.json({ payUrl: momoResponse.payUrl });
    } catch (error) {
        console.error("MOMO_REPAY_ERROR:", error);
        res.status(500).json({ message: "Internal Server Error during repayment" });
    }
};

// ─── RETURN REQUEST ───────────────────────────────────────────────────────────

const parseBankInfo = (rawBank: any) => {
    if (!rawBank) return null;
    let bankData = typeof rawBank === 'string' ? JSON.parse(rawBank) : rawBank;
    return {
        name: bankData.name || bankData.bankName || "N/A",
        acc: bankData.acc || bankData.bankNumber || "N/A",
        owner: bankData.owner || bankData.accountHolder || "N/A"
    };
};

// Fix 5: Tăng cường ownership check – JWT user_id ưu tiên hơn email
export const submitReturnRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reason_code, description, email } = req.body;
        const orderId = Number(req.params.id);

        const rawBank = req.body.refund_bank_info || req.body.bankInfo;
        const finalBankInfo = parseBankInfo(rawBank);
        const images = (req as any).files
            ? (req as any).files.map((file: any) => `/uploads/${file.filename}`)
            : [];

        await prisma.$transaction(async (tx) => {
            // Lấy order ra trước, kiểm tra status
            const order = await tx.order.findFirst({ 
                where: { id: orderId, status: 'Delivered', payment_status: 'Paid' } 
            });
            if (!order) {
                throw new Error("The order is invalid, not delivered, or unpaid.");
            }

            // Fix 5: Kiểm tra ownership (hỗ trợ cả trường hợp user đã đăng nhập nhưng return đơn guest, và cho phép Admin)
            const isAdmin = req.user?.role === 'admin';
            if (order.user_id) {
                if (!isAdmin && (!req.user || req.user.id !== order.user_id)) {
                    throw new Error("Forbidden: This order belongs to another member.");
                }
            } else {
                if (!isAdmin && (!email || order.email !== email)) {
                    throw new Error("Forbidden: Email is required and must match the guest order.");
                }
            }

            const existing = await tx.returnRequest.findUnique({ where: { order_id: orderId } });
            if (existing) {
                throw new Error("A return request has already been submitted for this order.");
            }

            await tx.returnRequest.create({
                data: {
                    order_id: orderId,
                    reason_code,
                    description: description || null,
                    images: JSON.stringify(images),
                    refund_bank_info: JSON.stringify(finalBankInfo),
                    status: 'Pending'
                }
            });

            await tx.order.update({
                where: { id: orderId },
                data: { status: 'Return_Requested' }
            });
        });

        res.status(200).json({ message: "Return request submitted successfully" });
    } catch (error: any) {
        console.error("ERROR_SUBMIT_RETURN:", error);
        res.status(500).json({ message: error.message });
    }
};
