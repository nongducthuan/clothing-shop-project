import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';

import * as categoryController from '../../controllers/admin/categoryController';
import * as inventoryController from '../../controllers/admin/inventoryController';
import * as membershipController from '../../controllers/admin/membershipController';
import * as orderController from '../../controllers/admin/orderController';
import * as productController from '../../controllers/admin/productController';
import * as promotionController from '../../controllers/admin/promotionController';
import * as saleController from '../../controllers/admin/saleController';
import * as voucherController from '../../controllers/admin/voucherController';
import * as bannerController from '../../controllers/admin/bannerController';
import * as statsController from '../../controllers/admin/statsController';

const router = Router();

// Apply auth middleware for all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', statsController.getAdminStats);

router.get('/products', productController.getProducts);
router.post('/products', productController.addProduct);
router.put('/products/:id', productController.editProduct);
router.delete('/products/:id', productController.removeProduct);
router.get('/products/:id', productController.getProductDetail);

router.post('/products/:productId/colors', productController.addColor);
router.delete('/colors/:id', productController.removeColor);

router.post('/colors/:colorId/sizes', productController.addSize);
router.put('/sizes/:id', productController.updateSize);
router.delete('/sizes/:id', productController.removeSize);

router.get('/categories', categoryController.getCategories);
router.post('/categories', categoryController.createCategory);
router.get('/categories/recommend', categoryController.getCategoryRecommendations);
router.get('/categories/:id/images', categoryController.getCategoryImages);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

router.get('/inventory', inventoryController.getInventory);

router.get('/memberships', membershipController.getMemberships);
router.post('/memberships', membershipController.createMembership);
router.put('/memberships/:id', membershipController.updateMembership);
router.delete('/memberships/:id', membershipController.deleteMembership);

router.get('/orders', orderController.getOrders);
router.put('/orders/:id/status', orderController.updateOrderStatus);
router.put('/orders/:id/payment', orderController.confirmPayment);
router.post('/orders/:id/return/approve', orderController.approveReturn);
router.post('/orders/:id/return/reject', orderController.rejectReturn);

// Hoàn tác duyệt nhầm Return Approved — hành động nguy hiểm (đụng kho/tiền/sổ),
// chống double-click / retry làm trừ kho 2 lần.
const undoApproveLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many undo attempts. Please wait a minute and try again.' },
});
router.post('/orders/:id/return/undo-approve', undoApproveLimiter, orderController.undoApproveReturn);

router.get('/promotions', promotionController.getAdminPromotions);
router.post('/promotions', promotionController.createPromotion);
router.put('/promotions/:id', promotionController.updatePromotion);
router.delete('/promotions/:id', promotionController.deletePromotion);

router.get('/sales', saleController.getAllSalesAdmin);
router.post('/sales', saleController.createSaleAdmin);
router.put('/sales/:id', saleController.updateSaleAdmin);
router.put('/sales/:id/status', saleController.toggleSaleStatus);
router.delete('/sales/:id', saleController.removeSale);
router.get('/sales/:id/details', saleController.getSaleDetailsAdmin);

router.get('/vouchers', voucherController.getAllVouchersAdmin);
router.post('/vouchers', voucherController.createVoucherAdmin);
router.put('/vouchers/:id', voucherController.updateVoucherAdmin);
router.put('/vouchers/:id/status', voucherController.toggleVoucherStatus);
router.delete('/vouchers/:id', voucherController.removeVoucher);
router.get('/vouchers/:id/details', voucherController.getVoucherDetails);

router.get('/banners', bannerController.getBanners);
router.post('/banners', bannerController.addBanner);
router.put('/banners/:id', bannerController.editBanner);
router.delete('/banners/:id', bannerController.removeBanner);

export default router;
