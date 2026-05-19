const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware"); 

router.post('/apply', voucherController.applyVoucherClient);
router.get('/admin', authenticateToken, requireAdmin, voucherController.getAllVouchersAdmin);
router.post('/admin', authenticateToken, requireAdmin, voucherController.createVoucherAdmin);
router.put('/admin/:id/status', authenticateToken, requireAdmin, voucherController.toggleVoucherStatus);
router.delete('/admin/:id', authenticateToken, requireAdmin, voucherController.removeVoucher);
router.get('/admin/:id/details', authenticateToken, requireAdmin, voucherController.getVoucherDetails);
router.get('/active', voucherController.getActiveVouchers);

module.exports = router;