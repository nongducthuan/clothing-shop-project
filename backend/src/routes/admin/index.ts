import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';

// Import Admin Controllers
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

// --- Stats / Dashboard ---
router.get('/stats', statsController.getAdminStats);

// --- Products ---
router.get('/products', productController.getProducts);
router.post('/products', productController.addProduct);
router.put('/products/:id', productController.editProduct);
router.delete('/products/:id', productController.removeProduct);
router.get('/products/:id', productController.getProductDetail);

router.post('/products/:productId/colors', productController.addColor);
router.delete('/colors/:id', productController.removeColor);

router.post('/colors/:colorId/sizes', productController.addSize);
router.delete('/sizes/:id', productController.removeSize);

// --- Categories ---
router.get('/categories', categoryController.getCategories);
router.post('/categories', categoryController.createCategory);
router.get('/categories/recommend', categoryController.getCategoryRecommendations);
router.get('/categories/:id/images', categoryController.getCategoryImages);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// --- Inventory ---
router.get('/inventory', inventoryController.getInventory);

// --- Memberships ---
router.get('/memberships', membershipController.getMemberships);
router.post('/memberships', membershipController.createMembership);
router.put('/memberships/:id', membershipController.updateMembership);
router.delete('/memberships/:id', membershipController.deleteMembership);

// --- Orders ---
router.get('/orders', orderController.getOrders);
router.put('/orders/:id/status', orderController.updateOrderStatus);
router.put('/orders/:id/payment', orderController.confirmPayment);
router.post('/orders/:id/return/approve', orderController.approveReturn);
router.post('/orders/:id/return/reject', orderController.rejectReturn);

// --- Promotions (Buy X Get Y) ---
router.get('/promotions', promotionController.getAdminPromotions);
router.post('/promotions', promotionController.createPromotion);
router.put('/promotions/:id', promotionController.updatePromotion);
router.delete('/promotions/:id', promotionController.deletePromotion);

// --- Sales ---
router.get('/sales', saleController.getAllSalesAdmin);
router.post('/sales', saleController.createSaleAdmin);
router.put('/sales/:id', saleController.updateSaleAdmin);
router.put('/sales/:id/status', saleController.toggleSaleStatus);
router.delete('/sales/:id', saleController.removeSale);
router.get('/sales/:id/details', saleController.getSaleDetailsAdmin);

// --- Vouchers ---
router.get('/vouchers', voucherController.getAllVouchersAdmin);
router.post('/vouchers', voucherController.createVoucherAdmin);
router.put('/vouchers/:id', voucherController.updateVoucherAdmin);
router.put('/vouchers/:id/status', voucherController.toggleVoucherStatus);
router.delete('/vouchers/:id', voucherController.removeVoucher);
router.get('/vouchers/:id/details', voucherController.getVoucherDetails);

// --- Banners ---
router.get('/banners', bannerController.getBanners);
router.post('/banners', bannerController.addBanner);
router.put('/banners/:id', bannerController.editBanner);
router.delete('/banners/:id', bannerController.removeBanner);

export default router;
