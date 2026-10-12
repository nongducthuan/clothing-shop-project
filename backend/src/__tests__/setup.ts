/**
 * Jest Global Setup
 * Set environment variables for all tests (no real .env needed).
 */

process.env.JWT_SECRET = 'test-jwt-secret-key-for-unit-tests';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-unit-tests';
process.env.MOMO_PARTNER_CODE = 'MOMO_TEST';
process.env.MOMO_ACCESS_KEY = 'test_access_key';
process.env.MOMO_SECRET_KEY = 'test_secret_key_momo';
process.env.VNP_TMNCODE = 'TEST_TMN';
process.env.VNP_HASHSECRET = 'test_secret_key_vnpay';
process.env.VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
process.env.VNP_RETURNURL = 'http://localhost:5173/payment-return';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.BACKEND_URL = 'http://localhost:5000/api';
