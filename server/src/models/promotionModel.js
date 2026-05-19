const db = require('../db');

const promotionModel = {
    // Purpose: To know which promotions are in used.
    getActiveBuyXGetYPromotions: async () => {
        const query = `
            SELECT * FROM buy_x_get_y_promotions
            WHERE status = 'active'
              AND NOW() BETWEEN start_date AND end_date
              AND (total_gift_limit IS NULL OR total_gifts_issued < total_gift_limit)
            ORDER BY priority DESC;
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    getVariantsByProductId: async (productId) => {
        const query = `
        SELECT
            ps.id AS size_id,
            pc.id AS color_id,
            pc.color_name,
            pc.image_url,
            ps.size,
            ps.stock
        FROM product_colors pc
        JOIN product_sizes ps ON pc.id = ps.color_id
        WHERE pc.product_id = ?
    `;
        const [rows] = await db.execute(query, [productId]);
        return rows;
    },

    getAllPromotions: async () => {
        const query = `SELECT * FROM buy_x_get_y_promotions ORDER BY created_at DESC;`;
        const [rows] = await db.query(query);
        return rows;
    },

    createPromotion: async (data) => {
        const query = `
            INSERT INTO buy_x_get_y_promotions
            (name, description, buy_product_id, buy_quantity, gift_product_id, gift_quantity, start_date, end_date, max_gift_per_order, total_gift_limit, priority, is_stackable, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `;
        const values = [
            data.name, data.description, data.buy_product_id, data.buy_quantity,
            data.gift_product_id, data.gift_quantity, data.start_date, data.end_date,
            data.max_gift_per_order, data.total_gift_limit, data.priority || 0, data.is_stackable
        ];
        const [result] = await db.query(query, values);
        return result.insertId;
    },

    deletePromotion: async (id) => {
        const query = `DELETE FROM buy_x_get_y_promotions WHERE id = ?;`;
        const [result] = await db.query(query, [id]);
        return result.affectedRows;
    },

    updateGiftStockAndIssued: async (connection, promotionId, sizeId, quantity) => {
        const updatePromoQuery = `
            UPDATE buy_x_get_y_promotions
            SET total_gifts_issued = total_gifts_issued + ?
            WHERE id = ?
              AND (total_gift_limit IS NULL OR total_gifts_issued + ? <= total_gift_limit)
        `;
        const [promoRes] = await connection.execute(updatePromoQuery, [quantity, promotionId, quantity]);

        if (promoRes.affectedRows === 0) {
            throw new Error(`Khuyến mãi ID ${promotionId} đã hết lượt nhận quà hoặc không tồn tại.`);
        }

        const updateStockQuery = `
            UPDATE product_sizes
            SET stock = stock - ?
            WHERE id = ? AND stock >= ?
        `;
        const [stockRes] = await connection.execute(updateStockQuery, [quantity, sizeId, quantity]);

        if (stockRes.affectedRows === 0) {
            throw new Error(`Quà tặng với size_id ${sizeId} đã hết hàng trong kho.`);
        }
    },

    updatePromotion: async (id, data) => {
        const query = `
            UPDATE buy_x_get_y_promotions
            SET name = ?, description = ?, buy_product_id = ?, buy_quantity = ?,
                gift_product_id = ?, gift_quantity = ?, start_date = ?, end_date = ?,
                max_gift_per_order = ?, total_gift_limit = ?, priority = ?, is_stackable = ?
            WHERE id = ?
        `;
        const values = [
            data.name, data.description, data.buy_product_id, data.buy_quantity,
            data.gift_product_id, data.gift_quantity, data.start_date, data.end_date,
            data.max_gift_per_order, data.total_gift_limit, data.priority || 0, data.is_stackable,
            id
        ];
        const [result] = await db.query(query, values);
        return result.affectedRows;
    }
};

module.exports = promotionModel;
