const db = require("../db");
const orderModel = require("../models/orderModel");
const { sendEmail } = require("../utils/emailService");
const { recordInteraction } = require("../services/interactionService");
const https = require('https');
const crypto = require('crypto');

// ==========================================================================
// HELPER FUNCTIONS
// ==========================================================================

async function calculateOrderTotal(connection, items) {
    let serverCalculatedTotal = 0;
    const itemsToSave = [];

    for (const item of items) {
        const sql = `
            SELECT
                p.price,
                COALESCE(MAX(s.discount_percent), 0) AS active_discount_percent
            FROM products p
            LEFT JOIN product_sales ps ON p.id = ps.product_id
            LEFT JOIN sales s ON ps.sale_id = s.id
                AND s.status = 1
                AND NOW() BETWEEN s.start_date AND s.end_date
            WHERE p.id = ?
            GROUP BY p.id
        `;

        const [productRows] = await connection.execute(sql, [item.product_id]);

        if (productRows.length === 0) {
            throw new Error(`Product not found (product_id=${item.product_id})`);
        }

        const isGift = item.is_gift === true;
        let finalItemPrice = 0;

        if (!isGift) {
            const originalPrice = parseFloat(productRows[0].price);
            const salePrice = productRows[0].sale_price ? parseFloat(productRows[0].sale_price) : originalPrice;
            finalItemPrice = salePrice;
            serverCalculatedTotal += finalItemPrice * item.quantity;
        }

        itemsToSave.push({
            product_id: item.product_id,
            color_id: item.color_id || null,
            size_id: item.size_id || null,
            quantity: item.quantity,
            price: finalItemPrice,
            is_gift: isGift,
            promotion_id: item.promotion_id || null
        });
    }

    return { serverCalculatedTotal, itemsToSave };
}

async function applyMembershipDiscount(connection, userId, total) {
    if (!userId) return { discountAmount: 0, finalTotal: total };

    const [memberRows] = await connection.execute(
        `SELECT m.discount_percent FROM users u
         JOIN memberships m ON u.membership_id = m.id
         WHERE u.id = ?`,
        [userId]
    );

    if (memberRows.length > 0) {
        const discountPercent = memberRows[0].discount_percent;
        const discountAmount = (total * discountPercent) / 100;
        return { discountAmount, finalTotal: total - discountAmount };
    }

    return { discountAmount: 0, finalTotal: total };
}

async function validateAndLockInventory(connection, itemsToSave) {
    for (const item of itemsToSave) {
        if (!item.size_id) {
            throw new Error("Missing size_id for inventory validation");
        }

        const [rows] = await connection.execute(
            "SELECT stock FROM product_sizes WHERE id = ? FOR UPDATE",
            [item.size_id]
        );

        if (rows.length === 0) {
            throw new Error(`Invalid size_id (${item.size_id})`);
        }

        if (rows[0].stock < item.quantity) {
            throw new Error(`Insufficient stock for product (size_id=${item.size_id})`);
        }
    }
}

const parseBankInfo = (rawBank) => {
    if (!rawBank) return null;
    let bankData = typeof rawBank === 'string' ? JSON.parse(rawBank) : rawBank;

    return {
        name: bankData.name || bankData.bankName || "N/A",
        acc: bankData.acc || bankData.bankNumber || "N/A",
        owner: bankData.owner || bankData.accountHolder || "N/A"
    };
};

// ==========================================================================
// MOMO HELPER
// ==========================================================================

async function getMomoPayUrl(orderId, amountInput, orderInfo) {
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;

    // Ensure amount is an integer for MoMo API
    const amountNumber = Math.round(Number(amountInput));
    const amountString = amountNumber.toString();

    const requestId = `${orderId}_${Date.now()}`;
    const momoOrderId = requestId;

    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/profile`;
    const ipnUrl = `${process.env.NGROK_URL}/orders/momo-callback`;
    const requestType = "captureWallet";
    const extraData = "";

    // Generate Signature
    const rawSignature = `accessKey=${accessKey}&amount=${amountString}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const requestBody = JSON.stringify({
        partnerCode, accessKey, requestId, amount: amountNumber,
        orderId: momoOrderId, orderInfo, redirectUrl, ipnUrl,
        extraData, requestType, signature, lang: 'en'
    });

    console.log(`🔹 MoMo Request: Amount=${amountNumber} | Signature generated for Amount=${amountString}`);

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

// ==========================================================================
// MAIN CONTROLLERS
// ==========================================================================

async function sendOtpController(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const connection = await db.getConnection();
    try {
        await connection.execute("DELETE FROM otps WHERE email = ?", [email]);
        await connection.execute(
            "INSERT INTO otps (email, code, expires_at) VALUES (?, ?, ?)",
            [email, code, expiresAt]
        );

        sendEmail(email, "Your OTP Code", `Your verification code is: ${code}`);
        res.json({ message: "OTP sent to your email successfully" });
    } catch (err) {
        console.error("Send OTP Error:", err);
        res.status(500).json({ message: "Server error while sending OTP" });
    } finally {
        connection.release();
    }
}

async function verifyOtpAndGetOrders(req, res) {
    const { email, code } = req.body;
    const connection = await db.getConnection();

    try {
        const [otpRows] = await connection.execute("SELECT * FROM otps WHERE email = ? AND code = ?", [email, code]);

        if (otpRows.length === 0) return res.status(400).json({ message: "Invalid OTP code!" });

        const otpData = otpRows[0];
        if (new Date() > new Date(otpData.expires_at)) {
            return res.status(400).json({ message: "OTP code has expired!" });
        }

        const [orders] = await connection.execute("SELECT * FROM orders WHERE email = ? ORDER BY created_at DESC", [email]);

        for (let order of orders) {
            const [items] = await connection.execute(
                `SELECT
                    oi.quantity,
                    oi.price,
                    oi.is_gift,
                    p.name as product_name,
                    p.image_url as image,
                    pc.color_name,
                    ps.size
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                LEFT JOIN product_colors pc ON oi.color_id = pc.id
                LEFT JOIN product_sizes ps ON oi.size_id = ps.id
                WHERE oi.order_id = ?`,
                [order.id]
            );
            order.items = items;
        }

        await connection.execute("DELETE FROM otps WHERE email = ?", [email]);
        res.json({ message: "Verification successful", orders });
    } catch (err) {
        console.error("Order verification error:", err);
        res.status(500).json({ message: "System error while fetching orders" });
    } finally {
        connection.release();
    }
}

async function createOrderController(req, res) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.user?.id || req.body.user_id || null;
        const { address, items, phone, name, email, payment_method, voucher_id, total_price } = req.body;

        if (!address || !items || items.length === 0) {
            throw new Error("Invalid order data: Address or items are missing");
        }

        const { serverCalculatedTotal, itemsToSave } = await calculateOrderTotal(connection, items);

        // Use frontend price (if voucher applied) or fallback to server calculated price
        const finalTotal = total_price || (await applyMembershipDiscount(connection, userId, serverCalculatedTotal)).finalTotal;

        const orderId = await orderModel.createOrder(connection, {
            user_id: userId,
            voucher_id: voucher_id || null,
            total_price: finalTotal,
            address,
            phone,
            name,
            email,
            payment_method: payment_method || "cod",
        });

        await orderModel.addOrderItems(connection, orderId, itemsToSave);

        if (voucher_id) {
            await connection.execute(
                "UPDATE vouchers SET usage_limit = usage_limit - 1 WHERE id = ? AND usage_limit > 0",
                [voucher_id]
            );
        }

        await connection.commit();

        sendEmail(
            email || (req.user ? req.user.email : null),
            "Order Confirmation",
            `Thank you! Order #${orderId} has been placed successfully. Total: ${finalTotal.toLocaleString()} VND`
        ).catch(e => console.error("Email error:", e));

        if (userId) {
            itemsToSave.forEach(item => recordInteraction(userId, item.product_id, 'purchase'));
        }

        // MoMo Payment Handling
        if (payment_method === "momo") {
            try {
                const momoResponse = await getMomoPayUrl(orderId, finalTotal, `Payment for order #${orderId}`);
                return res.status(201).json({
                    message: "Redirecting to MoMo",
                    orderId,
                    payUrl: momoResponse.payUrl
                });
            } catch (momoError) {
                console.error("MoMo API Error:", momoError);
                return res.status(201).json({
                    message: "Order created but MoMo payment link failed. Please retry payment in your profile.",
                    orderId,
                    payUrl: null
                });
            }
        }

        return res.status(201).json({
            message: "Order placed successfully (COD)",
            orderId,
            total: finalTotal,
            payUrl: null
        });

    } catch (error) {
        await connection.rollback();
        console.error("Order creation failed:", error.message);
        return res.status(500).json({ message: "Failed to create order", error: error.message });
    } finally {
        connection.release();
    }
}

async function getOrders(req, res) {
    try {
        const userId = req.user.id;
        const orders = await orderModel.getOrdersByUserId(userId);
        res.json(orders);
    } catch (error) {
        console.error("Get orders error:", error);
        res.status(500).json({ message: "Error fetching order list" });
    }
}

async function changeOrderStatus(req, res) {
    try {
        const { order_id, new_status } = req.body;
        await orderModel.changeOrderStatus(order_id, new_status);
        res.json({ message: "Order status updated successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Failed to update order status", error: err.message });
    }
}

async function momoCallback(req, res) {
    try {
        const { orderId, resultCode } = req.body;
        if (resultCode === 0) {
            const parts = orderId.split('_');
            const realOrderId = orderId.startsWith('REPAY') ? parts[1] : parts[0];

            await db.execute("UPDATE orders SET payment_status = 'Paid' WHERE id = ?", [realOrderId]);

            try {
                await orderModel.changeOrderStatus(realOrderId, 'Confirmed');
            } catch (orderError) {
                console.error("Order Status Update Error (IPN):", orderError.message);
            }
        }
        res.status(204).send();
    } catch (error) {
        console.error("FULL IPN ERROR LOG:", error);
        return res.status(500).json({ message: "IPN Webhook Error", error: error.message });
    }
}

async function repayMoMoController(req, res) {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const { email } = req.body;

        const [rows] = await connection.execute("SELECT * FROM orders WHERE id = ?", [id]);
        const order = rows[0];

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Flexible Security Check (Member vs Guest)
        if (order.user_id) {
            const isOwner = (req.user && req.user.id === order.user_id) || (order.email === email);
            if (!isOwner) {
                return res.status(403).json({ message: "Member mismatch: You do not have permission to pay for this order." });
            }
        } else {
            if (!email || order.email !== email) {
                return res.status(403).json({ message: "Guest mismatch: Email does not match the order." });
            }
        }

        if (order.payment_method !== 'momo' || order.payment_status === 'Paid') {
            return res.status(400).json({ message: "This order cannot be repaid or is already paid." });
        }

        const momoOrderId = `REPAY_${order.id}_${Date.now()}`;
        const momoResponse = await getMomoPayUrl(
            momoOrderId,
            order.total_price,
            `Retry payment for order #${order.id}`
        );

        return res.json({ payUrl: momoResponse.payUrl });

    } catch (error) {
        console.error("MOMO_REPAY_ERROR:", error);
        res.status(500).json({ message: "Internal Server Error during repayment" });
    } finally {
        connection.release();
    }
}

const submitReturnRequest = async (req, res) => {
    try {
        const { reason_code, description, email } = req.body;
        const orderId = req.params.id;

        const rawBank = req.body.refund_bank_info || req.body.bankInfo;
        const finalBankInfo = parseBankInfo(rawBank);
        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        await orderModel.createReturnRequest(orderId, {
            guestEmail: email,
            reason: reason_code,
            note: description,
            bankInfo: finalBankInfo,
            images
        });

        res.status(200).json({ message: "Return request submitted successfully" });
    } catch (error) {
        console.error("ERROR_SUBMIT_RETURN:", error);
        res.status(500).json({ message: error.message });
    }
};

async function approveReturn(req, res) {
    const orderId = req.params.id;
    try {
        await orderModel.updateReturnRequest(orderId, 'Approved', 'Refunded');
        await orderModel.changeOrderStatus(orderId, 'Return Approved');
        return res.status(200).json({ message: "Return request approved successfully!" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || "Server Error" });
    }
}

async function rejectReturn(req, res) {
    const orderId = req.params.id;
    const { adminNote } = req.body;
    try {
        await orderModel.updateReturnRequest(orderId, 'Rejected', adminNote);
        await orderModel.changeOrderStatus(orderId, 'Return Rejected');
        return res.status(200).json({ message: "Return request rejected successfully." });
    } catch (err) {
        return res.status(500).json({ message: "Failed to reject return request", error: err.message });
    }
}

module.exports = {
    sendOtpController,
    verifyOtpAndGetOrders,
    createOrderController,
    getOrders,
    changeOrderStatus,
    getMomoPayUrl,
    momoCallback,
    repayMoMoController,
    submitReturnRequest,
    approveReturn,
    rejectReturn
};
