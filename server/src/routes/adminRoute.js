const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Áp dụng middleware cho tất cả route admin
router.use(authenticateToken, requireAdmin);

// 1. Quản lý Sản phẩm
router.get('/products', adminController.getProducts);
router.get('/products/:id', adminController.getProductDetail);
router.post('/products', adminController.addProduct);
router.put('/products/:id', adminController.editProduct);
router.delete('/products/:id', adminController.removeProduct);

// 2. Quản lý Màu & Size
router.post('/products/:productId/colors', adminController.addColor);
router.delete('/colors/:id', adminController.removeColor);
router.post('/colors/:colorId/sizes', adminController.addSize);
router.delete('/sizes/:id', adminController.removeSize);

// 3. Quản lý Đơn hàng
router.get('/orders', adminController.getOrders);
router.put('/orders/:id', adminController.updateOrderStatus);
router.put('/orders/:id/payment', adminController.confirmPayment);

// 4. Quản lý Banner 
router.get('/banners', adminController.getBanners);
router.post('/banners', adminController.addBanner);
router.put('/banners/:id', adminController.editBanner);
router.delete('/banners/:id', adminController.removeBanner);

// 5. Báo cáo thống kê
router.get("/stats", adminController.getStats);

module.exports = router;
