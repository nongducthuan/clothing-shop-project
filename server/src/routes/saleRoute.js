const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware"); 

router.get('/active', saleController.getClientSales);
router.get('/admin', authenticateToken, requireAdmin, saleController.getAllSalesAdmin);
router.post('/admin', authenticateToken, requireAdmin, saleController.createSaleAdmin);
router.put('/admin/:id/status', authenticateToken, requireAdmin, saleController.toggleSaleStatus);
router.delete('/admin/:id', authenticateToken, requireAdmin, saleController.removeSale);
router.get('/admin/:id/details', authenticateToken, requireAdmin, saleController.getSaleDetailsAdmin);
router.get('/admin/active-list', authenticateToken, requireAdmin, saleController.getClientSales);

module.exports = router;