const pool = require("../db");

async function createSale(saleData) {
  const { name, discount_percent, apply_scope, start_date, end_date } = saleData;
  const sql = `INSERT INTO sales (name, discount_percent, apply_scope, start_date, end_date) 
               VALUES (?, ?, ?, ?, ?)`;
  const [result] = await pool.query(sql, [
    name,
    discount_percent || 0,
    apply_scope || 'all',
    start_date,
    end_date
  ]);
  return result.insertId;
}

async function addProductsToSale(saleId, productIds) {
  const values = productIds.map(productId => [productId, saleId]);
  const sql = `INSERT INTO product_sales (product_id, sale_id) VALUES ?`;
  return await pool.query(sql, [values]);
}

async function getAllSalesAdmin() {
  const sql = `SELECT * FROM sales WHERE status = 1 ORDER BY created_at DESC`;
  const [rows] = await pool.query(sql);
  return rows;
}

async function updateSaleStatus(saleId, status) {
  if (status === 0) {
    const [rows] = await pool.query("SELECT name FROM sales WHERE id = ?", [saleId]);
    if (rows.length > 0) {
      const oldName = rows[0].name;
      const deletedName = `${oldName}_deleted_${Date.now()}`;
      const sql = `UPDATE sales SET status = ?, name = ? WHERE id = ?`;
      const [result] = await pool.query(sql, [status, deletedName, saleId]);
      return result.affectedRows;
    }
  }
  const sql = `UPDATE sales SET status = ? WHERE id = ?`;
  const [result] = await pool.query(sql, [status, saleId]);
  return result.affectedRows;
}

async function deleteSale(saleId) {
  const sql = `DELETE FROM sales WHERE id = ?`;
  const [result] = await pool.query(sql, [saleId]);
  return result.affectedRows;
}

async function getActiveSales() {
  const sql = `SELECT * FROM sales WHERE s.status = 1 AND NOW() BETWEEN s.start_date AND s.end_date`;
  const [rows] = await pool.query(sql);
  return rows;
}

async function getSaleDetails(saleId, type) {
  if (type === 'category') {
    const sql = `SELECT c.name, c.gender FROM sale_categories sc 
                 JOIN categories c ON sc.category_id = c.id 
                 WHERE sc.sale_id = ?`;
    const [rows] = await pool.query(sql, [saleId]);
    return rows; 
  } else if (type === 'product') {
    const sql = `SELECT p.name FROM product_sales ps 
                 JOIN products p ON ps.product_id = p.id 
                 WHERE ps.sale_id = ?`;
    const [rows] = await pool.query(sql, [saleId]);
    return rows.map(r => ({ name: r.name, gender: null })); 
  }
  return [];
}

module.exports = {
  createSale, addProductsToSale, getAllSalesAdmin, updateSaleStatus, deleteSale, getActiveSales, getSaleDetails
};