// PURPOSE: Provide an admin-only API to view current inventory

const pool = require('../db');

async function getInventory(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        pc.color_name,
        ps.size,
        ps.stock
      FROM products p
      JOIN product_colors pc ON pc.product_id = p.id
      JOIN product_sizes ps ON ps.color_id = pc.id
    `);

    res.json({ success: true, inventory: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
  }
}

module.exports = { getInventory };
