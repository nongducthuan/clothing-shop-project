const express = require('express');
const router = express.Router();
const { createOrderController, getOrders, sendOtpController, verifyOtpAndGetOrders, changeOrderStatus, momoCallback, repayMoMoController, submitReturnRequest, approveReturn, rejectReturn } = require('../controllers/orderController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post("/", createOrderController);
router.get('/', authenticateToken, getOrders);
router.post("/send-otp", sendOtpController);
router.post("/verify-otp", verifyOtpAndGetOrders);
router.post("/change-status", authenticateToken, changeOrderStatus);
router.post("/momo-callback", momoCallback);
router.post("/:id/repay", repayMoMoController);
router.put('/:id/return-request', upload.array('images'), submitReturnRequest);
router.put('/admin/:id/approve-return', authenticateToken, requireAdmin, approveReturn);
router.put('/admin/:id/reject-return', authenticateToken, requireAdmin, rejectReturn);

module.exports = router;
