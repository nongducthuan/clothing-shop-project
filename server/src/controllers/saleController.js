const SaleModel = require("../models/saleModel");
const pool = require("../db");

async function createSaleAdmin(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { name, discount_percent, productIds, categoryIds, buy_x, get_y, start_date, end_date, apply_scope } = req.body;
    const saleId = await SaleModel.createSale({
      name, discount_percent, buy_x, get_y, start_date, end_date, apply_scope
    });
    if (apply_scope === 'category' && categoryIds && categoryIds.length > 0) {
      const catValues = categoryIds.map(catId => [saleId, catId]);
      await connection.query(`INSERT INTO sale_categories (sale_id, category_id) VALUES ?`, [catValues]);
    }
    if (apply_scope === 'product' && productIds && productIds.length > 0) {
      const prodValues = productIds.map(pId => [pId, saleId]);
      await connection.query(`INSERT INTO product_sales (product_id, sale_id) VALUES ?`, [prodValues]);
    }
    await connection.commit();
    res.status(201).json({ success: true, message: "Created Successfully!" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
}

async function getAllSalesAdmin(req, res) {
  try {
    const sales = await SaleModel.getAllSalesAdmin();
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function toggleSaleStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    await SaleModel.updateSaleStatus(id, status);
    res.json({ success: true, message: "Update status successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function removeSale(req, res) {
  try {
    const { id } = req.params;
    const affectedRows = await SaleModel.updateSaleStatus(id, 0);
    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Promotion not found!"
      });
    }
    res.json({
      success: true,
      message: "Promotion deleted successfully (Moved to archives)!"
    });
  } catch (error) {
    console.error("Remove Sale Error:", error);
    res.status(500).json({
      success: false,
      message: "System error while deleting promotion: " + error.message
    });
  }
}

async function getClientSales(req, res) {
  try {
    const sales = await SaleModel.getActiveSales();
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getSaleDetailsAdmin(req, res) {
  try {
    const { id } = req.params;
    const { type } = req.query; 
    
    if (!id || !type) {
      return res.status(400).json({ success: false, message: "Missing id or type" });
    }

    const details = await SaleModel.getSaleDetails(id, type);
    res.json({ success: true, details });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { 
  createSaleAdmin, getAllSalesAdmin, toggleSaleStatus, removeSale, getClientSales, getSaleDetailsAdmin
};