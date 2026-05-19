const pool = require('../db');
const bcrypt = require('bcryptjs');

// 1. Tạo user mới (Mặc định cho hạng Bronze - ID 1 hoặc NULL tùy bạn thiết lập)
async function createUser(name, email, phone, password, role = 'customer') {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Bạn nên để mặc định membership_id là 1 (giả sử 1 là Bronze)
  const [result] = await pool.query(
    'INSERT INTO users (name, email, phone, password, role, membership_id) VALUES (?, ?, ?, ?, ?, 1)',
    [name, email, phone, hashedPassword, role]
  );
  return result.insertId;
}

// 2. Tìm user theo Email hoặc Phone (Giữ nguyên)
async function findUserByIdentifier(identifier) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ? OR phone = ?',
    [identifier, identifier]
  );
  return rows[0];
}

// 3. Cập nhật tổng chi tiêu (Cộng dồn số tiền mới)
async function updateUserSpending(userId, amount) {
  const query = 'UPDATE users SET total_spent = total_spent + ? WHERE id = ?';
  const [result] = await pool.query(query, [amount, userId]);
  return result;
}

// 4. Cập nhật hạng thành viên mới
async function updateMembershipTier(userId, membershipId) {
  const query = 'UPDATE users SET membership_id = ? WHERE id = ?';
  const [result] = await pool.query(query, [membershipId, userId]);
  return result;
}

// 5. Lấy thông tin user kèm theo quyền lợi giảm giá (Dùng khi tính tiền hóa đơn)
async function getUserWithDiscount(userId) {
  const query = `
    SELECT u.*, m.name as tier_name, m.discount_percent 
    FROM users u 
    LEFT JOIN memberships m ON u.membership_id = m.id 
    WHERE u.id = ?`;
  const [rows] = await pool.query(query, [userId]);
  return rows[0];
}

const updateUserPhone = async (id, phone) => {
  const query = 'UPDATE users SET phone = ? WHERE id = ?';
  const [result] = await pool.query(query, [phone, id]);
  return result;
};

module.exports = {
  createUser,
  findUserByIdentifier,
  updateUserPhone,
  updateUserSpending,
  updateMembershipTier,
  getUserWithDiscount
};