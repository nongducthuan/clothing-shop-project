const pool = require('../db');

const membership = {
    // Lấy tất cả các hạng hội viên, sắp xếp theo chi tiêu tối thiểu
    getAll: async () => {
        const [rows] = await db.query("SELECT * FROM memberships ORDER BY min_spending ASC");
        return rows;
    },

    // Tìm hạng hội viên phù hợp nhất dựa trên tổng chi tiêu
    findTierBySpending: async (totalSpent) => {
        const [rows] = await db.query(
            "SELECT id, name FROM memberships WHERE min_spending <= ? ORDER BY min_spending DESC LIMIT 1",
            [totalSpent]
        );
        return rows[0];
    },

    // Admin: Tạo hạng mới
    create: async (data) => {
        const { name, min_spending, discount_percent } = data;
        return db.query(
            "INSERT INTO memberships (name, min_spending, discount_percent) VALUES (?, ?, ?)",
            [name, min_spending, discount_percent]
        );
    },

    // Admin: Cập nhật hạng
    update: async (id, data) => {
        const { name, min_spending, discount_percent } = data;
        return db.query(
            "UPDATE memberships SET name=?, min_spending=?, discount_percent=? WHERE id=?",
            [name, min_spending, discount_percent, id]
        );
    }
};

module.exports = membership;