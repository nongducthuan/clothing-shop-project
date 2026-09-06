import { Router } from 'express';
import { authenticateToken, optionalAuthenticateToken } from '../../middleware/authMiddleware';
import { upload } from '../../middleware/uploadMiddleware';

// Import customer Controllers
import * as authController from '../../controllers/customer/authController';
import * as categoryController from '../../controllers/customer/categoryController';
import * as chatController from '../../controllers/customer/chatController';
import * as membershipController from '../../controllers/customer/membershipController';
import * as orderController from '../../controllers/customer/orderController';
import * as productController from '../../controllers/customer/productController';
import * as productDetailController from '../../controllers/customer/productDetailController';
import * as promotionController from '../../controllers/customer/promotionController';
import * as saleController from '../../controllers/customer/saleController';
import * as voucherController from '../../controllers/customer/voucherController';
import * as bannerController from '../../controllers/customer/bannerController';

const router = Router();

// --- Auth ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authenticateToken, authController.getMe);
router.put('/auth/profile', authenticateToken, authController.updateProfile);
router.put('/auth/password', authenticateToken, authController.changePassword);

// --- Banners ---
router.get('/banners', bannerController.getBanners);

// --- Categories ---
router.get('/categories', categoryController.getCategories);
router.get('/categories/preview', categoryController.getCategoriesWithPreview);
router.get('/categories/recommend', categoryController.getRecommendCategories);

// --- Chat AI ---
router.post('/chat', chatController.handleChat);
router.post('/chat/history', chatController.handleChatWithHistory);
router.delete('/chat/history', chatController.clearChatHistory);

// --- Memberships ---
router.get('/memberships', membershipController.getMemberships);

// --- Orders ---
router.post('/orders/otp/send', orderController.sendOtpController);
router.post('/orders/otp/verify', orderController.verifyOtpAndGetOrders);
router.post('/orders', optionalAuthenticateToken, orderController.createOrderController); // Note: might use req.user if auth token present
router.get('/orders', authenticateToken, orderController.getOrders);
router.put('/orders/status', optionalAuthenticateToken, orderController.changeOrderStatus);
router.post('/orders/:id/repay', optionalAuthenticateToken, orderController.repayMoMoController);
router.post('/orders/:id/return', optionalAuthenticateToken, upload.array('images'), orderController.submitReturnRequest);

// MoMo & VNPay Webhooks & Callbacks
router.post('/orders/momo-callback', orderController.momoCallback);
router.get('/orders/vnpay-ipn', orderController.vnpayIpn);
router.post('/orders/vnpay-ipn', orderController.vnpayIpn);
router.get('/orders/vnpay-return', orderController.vnpayReturn);

// --- Products ---
router.get('/products', productController.getProducts);
router.get('/products/search', productController.searchProducts);
router.get('/products/representative', productController.getRepresentative);
router.get('/products/:id', productController.getProduct);
router.get('/products/:id/options', productController.getProductOptions);
router.get('/products/:id/details', productDetailController.getProductDetail);
router.post('/products/interaction', authenticateToken, productController.logInteraction);
router.get('/products/recommendations/:userId', productController.getRecommendations);

// --- Promotions & Sales ---
router.get('/promotions', promotionController.getActivePromotions);
router.post('/promotions/calculate', promotionController.calculateCart);
router.get('/sales', saleController.getCustomerSales);

// --- Vouchers ---
router.get('/vouchers', voucherController.getActiveVouchers);
router.post('/vouchers/apply', voucherController.applyVoucherCustomer);

export default router;
