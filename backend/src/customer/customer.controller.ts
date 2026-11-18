import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Req,
  Res,
  Next,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response, NextFunction } from 'express';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { GuestOrderAccessGuard } from '../common/guards/guest-order-access.guard';

import { validate } from '../middleware/validateMiddleware';
import { upload, persistUploadedImages } from '../middleware/uploadMiddleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  applyVoucherSchema,
  createOrderSchema,
} from '../types/schemas';

import * as authController from '../controllers/customer/authController';
import * as bannerController from '../controllers/customer/bannerController';
import * as categoryController from '../controllers/customer/categoryController';
import * as chatController from '../controllers/customer/chatController';
import * as membershipController from '../controllers/customer/membershipController';
import * as orderController from '../controllers/customer/orderController';
import * as orderLookupController from '../controllers/customer/orderLookupController';
import * as paymentController from '../controllers/customer/paymentController';
import * as productController from '../controllers/customer/productController';
import * as productDetailController from '../controllers/customer/productDetailController';
import * as promotionController from '../controllers/customer/promotionController';
import * as returnController from '../controllers/customer/returnController';
import * as saleController from '../controllers/customer/saleController';
import * as voucherController from '../controllers/customer/voucherController';

type ExpressHandler = (req: Request, res: Response, next: NextFunction) => unknown;

const run = (fn: ExpressHandler, req: Request, res: Response, next: NextFunction) => fn(req, res, next);

@Controller()
export class CustomerController {
  // Auth
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  @Post('auth/register')
  register(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    validate(registerSchema)(req, res, (err) => {
      if (err) return next(err);
      return run(authController.register, req, res, next);
    });
  }

  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @Post('auth/login')
  login(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    validate(loginSchema)(req, res, (err) => {
      if (err) return next(err);
      return run(authController.login, req, res, next);
    });
  }

  @Post('auth/refresh')
  refreshToken(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(authController.refreshToken, req, res, next);
  }

  @UseGuards(JwtAuthGuard)
  @Post('auth/logout')
  logout(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(authController.logout, req, res, next);
  }

  @UseGuards(JwtAuthGuard)
  @Get('auth/me')
  getMe(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(authController.getMe, req, res, next);
  }

  @UseGuards(JwtAuthGuard)
  @Put('auth/profile')
  updateProfile(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(authController.updateProfile, req, res, next);
  }

  @UseGuards(JwtAuthGuard)
  @Put('auth/password')
  changePassword(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    validate(changePasswordSchema)(req, res, (err) => {
      if (err) return next(err);
      return run(authController.changePassword, req, res, next);
    });
  }

  // Banners
  @Get('banners')
  getBanners(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(bannerController.getBanners, req, res, next);
  }

  // Categories
  @Get('categories')
  getCategories(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(categoryController.getCategories, req, res, next);
  }

  @Get('categories/preview')
  getCategoriesWithPreview(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(categoryController.getCategoriesWithPreview, req, res, next);
  }

  @Get('categories/recommend')
  getRecommendCategories(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(categoryController.getRecommendCategories, req, res, next);
  }

  // Chat
  @Post('chat')
  handleChat(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(chatController.handleChat, req, res, next);
  }

  @Post('chat/history')
  handleChatWithHistory(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(chatController.handleChatWithHistory, req, res, next);
  }

  @Delete('chat/history')
  clearChatHistory(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(chatController.clearChatHistory, req, res, next);
  }

  // Memberships
  @Get('memberships')
  getMemberships(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(membershipController.getMemberships, req, res, next);
  }

  // Order OTP lookup
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @Post('orders/otp/send')
  sendOtpController(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(orderLookupController.sendOtpController, req, res, next);
  }

  @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
  @Post('orders/otp/verify')
  verifyOtpAndGetOrders(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(orderLookupController.verifyOtpAndGetOrders, req, res, next);
  }

  // Orders
  @UseGuards(OptionalJwtAuthGuard)
  @Post('orders')
  createOrderController(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    validate(createOrderSchema)(req, res, (err) => {
      if (err) return next(err);
      return run(orderController.createOrderController, req, res, next);
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders')
  getOrders(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(orderController.getOrders, req, res, next);
  }

  @UseGuards(OptionalJwtAuthGuard, GuestOrderAccessGuard)
  @Put('orders/status')
  changeOrderStatus(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(orderController.changeOrderStatus, req, res, next);
  }

  @UseGuards(OptionalJwtAuthGuard, GuestOrderAccessGuard)
  @Post('orders/:id/repay')
  repayMoMoController(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(paymentController.repayMoMoController, req, res, next);
  }

  @UseGuards(OptionalJwtAuthGuard, GuestOrderAccessGuard)
  @Post('orders/:id/return')
  submitReturnRequest(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    upload.array('images')(req, res, (err) => {
      if (err) return next(err);
      persistUploadedImages(req, res, (pErr) => {
        if (pErr) return next(pErr);
        return run(returnController.submitReturnRequest, req, res, next);
      });
    });
  }

  @UseGuards(OptionalJwtAuthGuard, GuestOrderAccessGuard)
  @Delete('orders/:id/return')
  cancelReturnRequest(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(returnController.cancelReturnRequest, req, res, next);
  }

  // Payment Webhooks & Callbacks
  @Post('orders/momo-callback')
  momoCallback(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(paymentController.momoCallback, req, res, next);
  }

  @Get('orders/momo-return')
  momoReturn(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(paymentController.momoReturn, req, res, next);
  }

  @Get('orders/vnpay-ipn')
  vnpayIpnGet(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(paymentController.vnpayIpn, req, res, next);
  }

  @Post('orders/vnpay-ipn')
  vnpayIpnPost(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(paymentController.vnpayIpn, req, res, next);
  }

  @Get('orders/vnpay-return')
  vnpayReturn(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(paymentController.vnpayReturn, req, res, next);
  }

  // Products
  @Get('products')
  getProducts(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(productController.getProducts, req, res, next);
  }

  @Get('products/search')
  searchProducts(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(productController.searchProducts, req, res, next);
  }

  @Get('products/representative')
  getRepresentative(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(productController.getRepresentative, req, res, next);
  }

  @Post('products/prices')
  getProductPrices(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(productController.getProductPrices, req, res, next);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('products/recommendations/:userId')
  getRecommendations(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(productController.getRecommendations, req, res, next);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('products/:id')
  getProduct(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(productController.getProduct, req, res, next);
  }

  @Get('products/:id/options')
  getProductOptions(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(productController.getProductOptions, req, res, next);
  }

  @Get('products/:id/details')
  getProductDetail(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(productDetailController.getProductDetail, req, res, next);
  }

  @UseGuards(JwtAuthGuard)
  @Post('products/interaction')
  logInteraction(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(productController.logInteraction, req, res, next);
  }

  // Promotions
  @Get('promotions')
  getActivePromotions(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(promotionController.getActivePromotions, req, res, next);
  }

  @Post('promotions/calculate')
  calculateCart(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(promotionController.calculateCart, req, res, next);
  }

  // Sales
  @Get('sales')
  getCustomerSales(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(saleController.getCustomerSales, req, res, next);
  }

  // Vouchers
  @Get('vouchers')
  getActiveVouchers(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(voucherController.getActiveVouchers, req, res, next);
  }

  @Post('vouchers/apply')
  applyVoucherCustomer(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    validate(applyVoucherSchema)(req, res, (err) => {
      if (err) return next(err);
      return run(voucherController.applyVoucherCustomer, req, res, next);
    });
  }
}
