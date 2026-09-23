import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken, optionalAuthenticateToken } from '../../middleware/authMiddleware';
import { upload } from '../../middleware/uploadMiddleware';

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

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many registration attempts. Please try again later.' },
});

router.post('/auth/register', registerLimiter, authController.register);
router.post('/auth/login', loginLimiter, authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authenticateToken, authController.getMe);
router.put('/auth/profile', authenticateToken, authController.updateProfile);
router.put('/auth/password', authenticateToken, authController.changePassword);

router.get('/banners', bannerController.getBanners);

router.get('/categories', categoryController.getCategories);
router.get('/categories/preview', categoryController.getCategoriesWithPreview);
router.get('/categories/recommend', categoryController.getRecommendCategories);

router.post('/chat', chatController.handleChat);
router.post('/chat/history', chatController.handleChatWithHistory);
router.delete('/chat/history', chatController.clearChatHistory);

router.get('/memberships', membershipController.getMemberships);

// OTP tra cứu đơn: Brevo chỉ gửi mail, KHÔNG giới hạn ai gọi API.
// Không có 2 limiter này, 1 IP có thể spam 1000 email khác nhau/phút
// (đốt tiền Brevo + liệt mail server) hoặc brute-force mã OTP.
const otpSendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 lượt gửi / IP / 15 phút
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many OTP requests. Please try again in 15 minutes.' },
});
const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 lượt verify / IP / 15 phút
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many OTP attempts. Please try again in 15 minutes.' },
});
router.post('/orders/otp/send', otpSendLimiter, orderController.sendOtpController);
router.post('/orders/otp/verify', otpVerifyLimiter, orderController.verifyOtpAndGetOrders);
router.post('/orders', optionalAuthenticateToken, orderController.createOrderController);
router.get('/orders', authenticateToken, orderController.getOrders);
router.put('/orders/status', optionalAuthenticateToken, orderController.changeOrderStatus);
router.post('/orders/:id/repay', optionalAuthenticateToken, orderController.repayMoMoController);
router.post('/orders/:id/return', optionalAuthenticateToken, upload.array('images'), orderController.submitReturnRequest);
router.delete('/orders/:id/return', optionalAuthenticateToken, orderController.cancelReturnRequest);

router.post('/orders/momo-callback', orderController.momoCallback);
router.get('/orders/momo-return', orderController.momoReturn);
router.get('/orders/vnpay-ipn', orderController.vnpayIpn);
router.post('/orders/vnpay-ipn', orderController.vnpayIpn);
router.get('/orders/vnpay-return', orderController.vnpayReturn);

router.get('/products', productController.getProducts);
router.get('/products/search', productController.searchProducts);
router.get('/products/representative', productController.getRepresentative);
router.get('/products/:id', productController.getProduct);
router.get('/products/:id/options', productController.getProductOptions);
router.get('/products/:id/details', productDetailController.getProductDetail);
router.post('/products/interaction', authenticateToken, productController.logInteraction);
router.get('/products/recommendations/:userId', productController.getRecommendations);

router.get('/promotions', promotionController.getActivePromotions);
router.post('/promotions/calculate', promotionController.calculateCart);
router.get('/sales', saleController.getCustomerSales);

router.get('/vouchers', voucherController.getActiveVouchers);
router.post('/vouchers/apply', voucherController.applyVoucherCustomer);

export default router;
