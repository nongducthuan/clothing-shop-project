const pool = require("../db");

async function createVoucher(voucherData, connection = pool) {
  const { 
    code, description, discount_percent, max_discount_amount, 
    min_order_value, usage_limit, start_date, end_date, apply_scope 
  } = voucherData;
  
  const sql = `INSERT INTO vouchers 
               (code, description, discount_percent, max_discount_amount, min_order_value, usage_limit, start_date, end_date, apply_scope) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
               
  const [result] = await connection.query(sql, [
    code, description, discount_percent, 
    max_discount_amount || null,
    min_order_value || 0, 
    usage_limit || null, 
    start_date, end_date,
    apply_scope 
  ]);
  return result.insertId;
}

async function addProductsToVoucher(voucherId, productIds, connection = pool) {
  const values = productIds.map(pId => [pId, voucherId]);
  const sql = `INSERT INTO product_vouchers (product_id, voucher_id) VALUES ?`;
  return await connection.query(sql, [values]);
}

async function addCategoriesToVoucher(voucherId, categoryIds, connection = pool) {
  const values = categoryIds.map(catId => [voucherId, catId]);
  const sql = `INSERT INTO voucher_categories (voucher_id, category_id) VALUES ?`;
  return await connection.query(sql, [values]);
}

async function getAllVouchersAdmin() {
  const sql = `SELECT * FROM vouchers WHERE status = 1 ORDER BY created_at DESC`;
  const [rows] = await pool.query(sql);
  return rows;
}

async function updateVoucherStatus(voucherId, status) {
  if (status === 0) {
    const [rows] = await pool.query("SELECT code FROM vouchers WHERE id = ?", [voucherId]);
    if (rows.length > 0) {
      const oldCode = rows[0].code;
      const deletedCode = `${oldCode}_del_${Date.now()}`;
      const sql = `UPDATE vouchers SET status = ?, code = ? WHERE id = ?`;
      const [result] = await pool.query(sql, [status, deletedCode, voucherId]);
      return result.affectedRows;
    }
  }
  const sql = `UPDATE vouchers SET status = ? WHERE id = ?`;
  const [result] = await pool.query(sql, [status, voucherId]);
  return result.affectedRows;
}

async function deleteVoucher(voucherId) {
  const sql = `DELETE FROM vouchers WHERE id = ?`;
  const [result] = await pool.query(sql, [voucherId]);
  return result.affectedRows;
}

async function getVoucherDetailsAdmin(id) {
  const [vouchers] = await pool.query(`SELECT * FROM vouchers WHERE id = ?`, [id]);
  const voucher = vouchers[0];
  if (!voucher) return null;

  let details = [];
  if (voucher.apply_scope === 'product') {
    const [rows] = await pool.query(`
      SELECT p.id, p.name, c.name AS category_name, p.gender 
      FROM product_vouchers pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE pv.voucher_id = ?`, [id]);
    details = rows;
  } else if (voucher.apply_scope === 'category') {
    const [rows] = await pool.query(`
      SELECT c.id, c.name, c.gender FROM voucher_categories vc
      JOIN categories c ON vc.category_id = c.id
      WHERE vc.voucher_id = ?`, [id]);
    details = rows;
  }
  return { ...voucher, details };
}

async function incrementUsedCount(voucherId) {
  const sql = `UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?`;
  const [result] = await pool.query(sql, [voucherId]);
  return result.affectedRows;
}

async function findActiveVouchers({ category_id, product_id }) {
  // 1. Các điều kiện cơ bản luôn phải có
  let sql = `
    SELECT DISTINCT v.* FROM vouchers v
    LEFT JOIN voucher_categories vc ON v.id = vc.voucher_id
    LEFT JOIN product_vouchers pv ON v.id = pv.voucher_id
    WHERE v.status = 1 
    AND (v.usage_limit IS NULL OR v.used_count < v.usage_limit)
    AND (NOW() BETWEEN v.start_date AND v.end_date)
  `;

  // 2. Xử lý các điều kiện OR cho apply_scope
  // Luôn bắt đầu bằng 'all'
  let orConditions = ["v.apply_scope = 'all'"];
  let params = [];

  if (category_id) {
    orConditions.push("(v.apply_scope = 'category' AND vc.category_id = ?)");
    params.push(category_id);
  }

  if (product_id) {
    orConditions.push("(v.apply_scope = 'product' AND pv.product_id = ?)");
    params.push(product_id);
  }

  // Nối các điều kiện OR lại bằng dấu ngoặc bao quanh
  sql += ` AND ( ${orConditions.join(' OR ')} ) `;

  // 3. Sắp xếp
  sql += ` ORDER BY v.discount_percent DESC `;

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getVoucherDetailsByCode(code) {
  const sql = `
    SELECT v.*, 
      CASE 
        WHEN v.apply_scope = 'category' THEN (
          SELECT GROUP_CONCAT(category_id) 
          FROM voucher_categories 
          WHERE voucher_id = v.id
        )
        WHEN v.apply_scope = 'product' THEN (
          SELECT GROUP_CONCAT(product_id) 
          FROM product_vouchers 
          WHERE voucher_id = v.id
        )
        ELSE NULL 
      END AS allowed_ids_string
    FROM vouchers v
    WHERE v.code = ? AND v.status = 1 
      AND (v.start_date IS NULL OR v.start_date <= NOW())
      AND (v.end_date IS NULL OR v.end_date >= NOW())
    LIMIT 1
  `;
  
  const [rows] = await pool.query(sql, [code]);
  
  if (rows.length > 0) {
    const voucher = rows[0];
    // Chuyển chuỗi "1,2,3" thành mảng số [1, 2, 3]
    voucher.allowed_ids = voucher.allowed_ids_string 
      ? voucher.allowed_ids_string.split(',').map(Number) 
      : [];
    return voucher;
  }
  return null;
}

module.exports = {
  createVoucher,
  addProductsToVoucher,
  addCategoriesToVoucher,
  getAllVouchersAdmin,
  updateVoucherStatus,
  deleteVoucher,
  getVoucherDetailsAdmin,
  incrementUsedCount,
  findActiveVouchers,
  getVoucherDetailsByCode
};