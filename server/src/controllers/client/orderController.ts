import { Request, Response } from 'express';
import prisma from '../../../prisma/client';
import { sendEmail } from '../../utils/emailService';
import { recordInteraction } from '../../services/interactionService';
import https from 'https';
import crypto from 'crypto';
import { changeOrderStatusLogic } from '../admin/orderController';

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

        sendEmail(email, "Your OTP Code", `Your verification code is: ${code}`);
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
            where: { email, code }
        });

        if (!otpData) {
            res.status(400).json({ message: "Invalid OTP code!" });
            return;
        }

        if (new Date() > new Date(otpData.expires_at)) {
            res.status(400).json({ message: "OTP code has expired!" });
            return;
        }

        const orders = await prisma.order.findMany({
            where: { email },
            orderBy: { created_at: 'desc' },
            include: {
                items: {
                    include: {
                        product: { select: { name: true, image_url: true } },
                        color: { select: { color_name: true } },
                        size: { select: { size: true } }
                    }
                }
            }
        });

        // Flatten items for frontend compatibility
        const formattedOrders = orders.map(order => ({
            ...order,
            items: order.items.map(item => ({
                ...item,
                product_name: item.product?.name,
                image: item.product?.image_url,
                color_name: item.color?.color_name,
                size: item.size?.size
            }))
        }));

        await prisma.otp.deleteMany({ where: { email } });
        res.json({ message: "Verification successful", orders: formattedOrders });
    } catch (err) {
        console.error("Order verification error:", err);
        res.status(500).json({ message: "System error while fetching orders" });
    }
};

async function getMomoPayUrl(orderId: string, amountInput: number | string, orderInfo: string): Promise<any> {
    const partnerCode = process.env.MOMO_PARTNER_CODE || '';
    const accessKey = process.env.MOMO_ACCESS_KEY || '';
    const secretKey = process.env.MOMO_SECRET_KEY || '';

    const amountNumber = Math.round(Number(amountInput));
    const amountString = amountNumber.toString();
    const requestId = `${orderId}_${Date.now()}`;
    const momoOrderId = requestId;
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile`;
    const ipnUrl = `${process.env.NGROK_URL}/orders/momo-callback`;
    const requestType = "captureWallet";
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
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ errorCode: -1, message: "Error parsing MoMo response" });
                }
            });
        });

        req.on('error', e => reject(e));
        req.write(requestBody);
        req.end();
    });
}

export const createOrderController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id || req.body.user_id || null;
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

            // 1. Calculate price and check stock
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: Number(item.product_id) }
                });
                if (!product) throw new Error(`Product not found`);

                const sales = await tx.sale.findMany({
                    where: {
                        status: 1,
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

                const isGift = item.is_gift === true;
                let finalItemPrice = 0;

                if (!isGift) {
                    const discount = sales.length > 0 ? Number(sales[0].discount_percent) : 0;
                    finalItemPrice = Number(product.price) * (1 - discount / 100);
                    serverCalculatedTotal += finalItemPrice * item.quantity;
                }

                if (item.size_id) {
                    const size = await tx.productSize.findUnique({ where: { id: Number(item.size_id) } });
                    if (!size || size.stock < item.quantity) {
                        throw new Error(`Insufficient stock for product (size_id=${item.size_id})`);
                    }
                    await tx.productSize.update({
                        where: { id: Number(item.size_id) },
                        data: { stock: { decrement: item.quantity } }
                    });
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

            // 2. Membership Discount (always applied server-side)
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

            // Bug fix 1: Always use server-calculated total — never trust client-sent price
            finalTotal = serverCalculatedTotal;

            // Bug fix 2: Re-validate voucher in transaction before decrementing usage
            if (voucher_id) {
                const voucher = await tx.voucher.findUnique({
                    where: { id: Number(voucher_id) },
                    include: { product_vouchers: true, voucher_categories: true }
                });

                if (!voucher || voucher.status === 0) {
                    throw new Error('Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa.');
                }
                if (voucher.usage_limit !== null && voucher.usage_limit <= 0) {
                    throw new Error('Mã giảm giá đã hết lượt sử dụng.');
                }
                if (voucher.start_date && new Date() < voucher.start_date) {
                    throw new Error('Mã giảm giá chưa đến thời gian áp dụng.');
                }
                if (voucher.end_date && new Date() > voucher.end_date) {
                    throw new Error('Mã giảm giá đã hết hạn.');
                }
                if (finalTotal < Number(voucher.min_order_value)) {
                    throw new Error(`Đơn hàng chưa đạt giá trị tối thiểu ${Number(voucher.min_order_value).toLocaleString()}đ để dùng mã này.`);
                }

                // Re-verify scope: all scope always passes; product/category scopes must match at least 1 item
                if (voucher.apply_scope !== 'all') {
                    const productIds = itemsToSave.filter(i => !i.is_gift).map(i => i.product_id);
                    let scopeValid = false;

                    if (voucher.apply_scope === 'product') {
                        const allowedIds = voucher.product_vouchers.map(pv => pv.product_id);
                        scopeValid = productIds.some(id => allowedIds.includes(id));
                    } else if (voucher.apply_scope === 'category') {
                        const allowedCatIds = voucher.voucher_categories.map(vc => vc.category_id);
                        // Fetch category_id for each product in order
                        const products = await tx.product.findMany({
                            where: { id: { in: productIds } },
                            select: { id: true, category_id: true }
                        });
                        scopeValid = products.some(p => p.category_id && allowedCatIds.includes(p.category_id));
                    }

                    if (!scopeValid) {
                        throw new Error('Mã giảm giá không áp dụng cho các sản phẩm trong đơn hàng này.');
                    }
                }

                // Apply voucher discount to finalTotal
                let voucherDiscount = (finalTotal * Number(voucher.discount_percent || 0)) / 100;
                if (voucher.max_discount_amount && voucherDiscount > Number(voucher.max_discount_amount)) {
                    voucherDiscount = Number(voucher.max_discount_amount);
                }
                finalTotal = Math.max(0, finalTotal - voucherDiscount);

                // Decrement usage limit
                await tx.voucher.update({
                    where: { id: Number(voucher_id) },
                    data: {
                        usage_limit: voucher.usage_limit !== null
                            ? { decrement: 1 }
                            : undefined
                    }
                });
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
                    items: {
                        create: itemsToSave
                    }
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
                res.status(201).json({
                    message: "Redirecting to MoMo",
                    orderId,
                    payUrl: momoResponse.payUrl
                });
                return;
            } catch (momoError) {
                console.error("MoMo API Error:", momoError);
                res.status(201).json({
                    message: "Order created but MoMo payment link failed. Please retry payment in your profile.",
                    orderId,
                    payUrl: null
                });
                return;
            }
        }

        res.status(201).json({
            message: "Order placed successfully (COD)",
            orderId,
            total: finalTotal,
            payUrl: null
        });

    } catch (error: any) {
        console.error("Order creation failed:", error.message);
        res.status(500).json({ message: "Failed to create order", error: error.message });
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
                items: {
                    include: {
                        product: { select: { name: true, image_url: true } },
                        color: { select: { color_name: true } },
                        size: { select: { size: true } }
                    }
                }
            }
        });

        const formattedOrders = orders.map(order => ({
            ...order,
            items: order.items.map(item => ({
                ...item,
                product_name: item.product?.name,
                image_url: item.product?.image_url,
                color_name: item.color?.color_name,
                size: item.size?.size
            }))
        }));

        res.json(formattedOrders);
    } catch (error) {
        console.error("Get orders error:", error);
        res.status(500).json({ message: "Error fetching order list" });
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

export const momoCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId, resultCode } = req.body;
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

export const repayMoMoController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { email } = req.body;

        const order = await prisma.order.findUnique({ where: { id: Number(id) } });

        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }

        if (order.user_id) {
            const isOwner = (req.user && req.user.id === order.user_id) || (order.email === email);
            if (!isOwner) {
                res.status(403).json({ message: "Member mismatch: You do not have permission to pay for this order." });
                return;
            }
        } else {
            if (!email || order.email !== email) {
                res.status(403).json({ message: "Guest mismatch: Email does not match the order." });
                return;
            }
        }

        if (order.payment_method !== 'momo' || order.payment_status === 'Paid') {
            res.status(400).json({ message: "This order cannot be repaid or is already paid." });
            return;
        }

        const momoOrderId = `REPAY_${order.id}_${Date.now()}`;
        const momoResponse = await getMomoPayUrl(
            momoOrderId,
            Number(order.total_price),
            `Retry payment for order #${order.id}`
        );

        res.json({ payUrl: momoResponse.payUrl });

    } catch (error) {
        console.error("MOMO_REPAY_ERROR:", error);
        res.status(500).json({ message: "Internal Server Error during repayment" });
    }
};

const parseBankInfo = (rawBank: any) => {
    if (!rawBank) return null;
    let bankData = typeof rawBank === 'string' ? JSON.parse(rawBank) : rawBank;

    return {
        name: bankData.name || bankData.bankName || "N/A",
        acc: bankData.acc || bankData.bankNumber || "N/A",
        owner: bankData.owner || bankData.accountHolder || "N/A"
    };
};

export const submitReturnRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reason_code, description, email } = req.body;
        const orderId = Number(req.params.id);

        const rawBank = req.body.refund_bank_info || req.body.bankInfo;
        const finalBankInfo = parseBankInfo(rawBank);
        const images = (req as any).files ? (req as any).files.map((file: any) => `/uploads/${file.filename}`) : [];

        await prisma.$transaction(async (tx) => {
            const order = await tx.order.findFirst({
                where: { id: orderId, email: email, status: 'Delivered', payment_status: 'Paid' }
            });

            if (!order) {
                throw new Error("The order is invalid, not delivered, unpaid, or the email does not match.");
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
