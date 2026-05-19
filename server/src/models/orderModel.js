const pool = require('../db');

// ==========================================================================
// ORDER CRUD OPERATIONS
// ==========================================================================

async function createOrder(connection, data) {
    const sql = `
        INSERT INTO orders (user_id, voucher_id, name, email, phone, address, total_price, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await connection.execute(sql, [
        data.user_id,
        data.voucher_id,
        data.name,
        data.email,
        data.phone,
        data.address,
        data.total_price,
        data.payment_method
    ]);
    return result.insertId;
}

async function addOrderItems(connection, orderId, items) {
    // Transform items into a nested array for Bulk Insert
    const values = items.map(item => [
        orderId,
        item.product_id,
        item.color_id,
        item.size_id,
        item.quantity,
        item.price,
        item.is_gift ? 1 : 0,
        item.promotion_id || null
    ]);

    const sql = `INSERT INTO order_items (order_id, product_id, color_id, size_id, quantity, price, is_gift, promotion_id) VALUES ?`;
    const [result] = await connection.query(sql, [values]);

    return result;
}

async function getOrdersByUserId(userId) {
    const sql = `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`;
    const [orders] = await pool.query(sql, [userId]);

    // Fetch items for each order
    for (const order of orders) {
        const itemSql = `
            SELECT
                oi.*,
                p.name as product_name,
                p.image_url,
                pc.color_name,  -- Lấy tên màu
                ps.size         -- Lấy kích cỡ
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            LEFT JOIN product_colors pc ON oi.color_id = pc.id
            LEFT JOIN product_sizes ps ON oi.size_id = ps.id
            WHERE oi.order_id = ?
        `;
        const [items] = await pool.query(itemSql, [order.id]);
        order.items = items;
    }
    return orders;
}

// ==========================================================================
// ORDER STATUS & BUSINESS LOGIC (SRP Applied)
// ==========================================================================

async function handleInventoryUpdates(connection, orderId, oldStatus, newStatus) {
    const inactiveStatuses = ["Cancelled", "Return Approved"];
    const oldGroup = inactiveStatuses.includes(oldStatus) ? 1 : 2;
    const newGroup = inactiveStatuses.includes(newStatus) ? 1 : 2;

    if (oldGroup === newGroup) return; // No inventory change needed

    const [items] = await connection.query("SELECT * FROM order_items WHERE order_id=?", [orderId]);

    for (const item of items) {
        if (!item.size_id) continue;

        if (oldGroup === 1 && newGroup === 2) {
            // Deduct stock and check availability
            const [res] = await connection.query(
                "UPDATE product_sizes SET stock = stock - ? WHERE id = ? AND stock >= ?",
                [item.quantity, item.size_id, item.quantity]
            );
            if (res.affectedRows === 0) {
                throw new Error(`Product (Size ID: ${item.size_id}) has insufficient stock to confirm the order!`);
            }
        } else {
            // Restore stock (Return/Cancel)
            await connection.query(
                "UPDATE product_sizes SET stock = stock + ? WHERE id = ?",
                [item.quantity, item.size_id]
            );
        }
    }
}

async function handleFinancialUpdates(connection, orderId, userId, totalPrice, oldStatus, newStatus) {
    let revenueChange = 0;
    let orderCountChange = 0;
    const today = new Date().toISOString().split('T')[0];

    // Determine financial changes based on status transition
    if (oldStatus !== "Delivered" && newStatus === "Delivered") {
        revenueChange = totalPrice;
        orderCountChange = 1;
        await connection.query("UPDATE orders SET payment_status = 'Paid' WHERE id = ?", [orderId]);
    }
    else if (["Return Approved", "Cancelled"].includes(newStatus) && oldStatus === "Delivered") {
        revenueChange = -totalPrice;
        orderCountChange = -1;
        await connection.query("UPDATE orders SET payment_status = 'Refunded' WHERE id = ?", [orderId]);
    }
    else if (oldStatus === "Delivered" && newStatus !== "Delivered") {
        revenueChange = -totalPrice;
        orderCountChange = -1;
    }
    else if (newStatus === "Return Approved") {
        await connection.query("UPDATE orders SET payment_status = 'Refunded' WHERE id = ?", [orderId]);
    }

    if (revenueChange === 0) return; // No financial update needed

    // Update User Total Spent and Membership Tier
    if (userId) {
        await connection.query("UPDATE users SET total_spent = total_spent + ? WHERE id = ?", [revenueChange, userId]);

        const [u] = await connection.query("SELECT total_spent FROM users WHERE id=?", [userId]);
        const [tier] = await connection.query(
            "SELECT id FROM memberships WHERE min_spending <= ? ORDER BY min_spending DESC LIMIT 1",
            [u[0].total_spent]
        );

        if (tier.length > 0) {
            await connection.query("UPDATE users SET membership_id = ? WHERE id = ?", [tier[0].id, userId]);
        }
    }

    // Update Daily Revenues
    await connection.query(`
        INSERT INTO revenues (report_date, total_sales, total_orders)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
            total_sales = total_sales + VALUES(total_sales),
            total_orders = total_orders + VALUES(total_orders)
    `, [today, revenueChange, orderCountChange]);
}

async function changeOrderStatus(orderId, newStatus) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [orderRows] = await connection.query("SELECT * FROM orders WHERE id=?", [orderId]);
        const order = orderRows[0];

        if (!order) throw new Error("Order not found");

        const oldStatus = order.status;
        const totalPrice = Number(order.total_price);
        const userId = order.user_id;

        // Delegate responsibilities to helper functions
        await handleInventoryUpdates(connection, orderId, oldStatus, newStatus);
        await handleFinancialUpdates(connection, orderId, userId, totalPrice, oldStatus, newStatus);

        // Finally, update the status
        await connection.query("UPDATE orders SET status=? WHERE id=?", [newStatus, orderId]);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// ==========================================================================
// RETURN REQUEST OPERATIONS
// ==========================================================================

async function createReturnRequest(orderId, data) {
    const { guestEmail, reason, note, bankInfo, images } = data;

    // 1. Verify order existence and eligibility
    const [check] = await pool.query(
        "SELECT id FROM orders WHERE id = ? AND email = ? AND status = 'Delivered'",
        [orderId, guestEmail]
    );

    if (check.length === 0) {
        throw new Error("The order is invalid, not delivered, or the email does not match.");
    }

    // 2. Prevent duplicate return requests
    const [existing] = await pool.query("SELECT id FROM return_requests WHERE order_id = ?", [orderId]);
    if (existing.length > 0) {
        throw new Error("A return request has already been submitted for this order.");
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 3. Insert return request
        const sqlInsert = `
            INSERT INTO return_requests (order_id, reason_code, description, images, refund_bank_info, status)
            VALUES (?, ?, ?, ?, ?, 'Pending')
        `;
        await connection.query(sqlInsert, [
            orderId,
            reason,
            note,
            JSON.stringify(images),
            JSON.stringify(bankInfo)
        ]);

        // 4. Update order status to hide the return button on Frontend
        await connection.query(`UPDATE orders SET status = 'Return Requested' WHERE id = ?`, [orderId]);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function updateReturnRequest(orderId, status, adminNote = '') {
    const sql = "UPDATE return_requests SET status = ?, admin_response = ? WHERE order_id = ?";
    const [result] = await pool.query(sql, [status, adminNote, orderId]);
    return result;
}

module.exports = {
    createOrder,
    addOrderItems,
    getOrdersByUserId,
    changeOrderStatus,
    createReturnRequest,
    updateReturnRequest
};
