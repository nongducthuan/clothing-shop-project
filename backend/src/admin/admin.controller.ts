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
import { AdminGuard } from '../common/guards/admin.guard';

import * as statsController from '../controllers/admin/statsController';
import * as productController from '../controllers/admin/productController';
import * as colorController from '../controllers/admin/colorController';
import * as sizeController from '../controllers/admin/sizeController';
import * as categoryController from '../controllers/admin/categoryController';
import * as inventoryController from '../controllers/admin/inventoryController';
import * as membershipController from '../controllers/admin/membershipController';
import * as userController from '../controllers/admin/userController';
import * as orderController from '../controllers/admin/orderController';
import * as adminReturnController from '../controllers/admin/adminReturnController';
import * as promotionController from '../controllers/admin/promotionController';
import * as saleController from '../controllers/admin/saleController';
import * as voucherController from '../controllers/admin/voucherController';
import * as bannerController from '../controllers/admin/bannerController';

type ExpressHandler = (req: Request, res: Response, next: NextFunction) => unknown;

const run = (fn: ExpressHandler, req: Request, res: Response, next: NextFunction) => fn(req, res, next);

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  // Stats
  @Get('stats')
  getAdminStats(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(statsController.getAdminStats, req, res, next);
  }

  // Products
  @Get('products')
  getProducts(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(productController.getProducts, req, res, next);
  }

  @Post('products')
  addProduct(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(productController.addProduct, req, res, next);
  }

  @Get('products/:id')
  getProductDetail(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(productController.getProductDetail, req, res, next);
  }

  @Put('products/:id')
  editProduct(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(productController.editProduct, req, res, next);
  }

  @Delete('products/:id')
  removeProduct(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(productController.removeProduct, req, res, next);
  }

  // Colors & Sizes
  @Post('products/:productId/colors')
  addColor(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(colorController.addColor, req, res, next);
  }

  @Delete('colors/:id')
  removeColor(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(colorController.removeColor, req, res, next);
  }

  @Post('colors/:colorId/sizes')
  addSize(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(sizeController.addSize, req, res, next);
  }

  @Put('sizes/:id')
  updateSize(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(sizeController.updateSize, req, res, next);
  }

  @Delete('sizes/:id')
  removeSize(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(sizeController.removeSize, req, res, next);
  }

  // Categories
  @Get('categories')
  getCategories(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(categoryController.getCategories, req, res, next);
  }

  @Post('categories')
  createCategory(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(categoryController.createCategory, req, res, next);
  }

  @Get('categories/recommend')
  getCategoryRecommendations(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(categoryController.getCategoryRecommendations, req, res, next);
  }

  @Get('categories/:id/images')
  getCategoryImages(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(categoryController.getCategoryImages, req, res, next);
  }

  @Put('categories/:id')
  updateCategory(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(categoryController.updateCategory, req, res, next);
  }

  @Delete('categories/:id')
  deleteCategory(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(categoryController.deleteCategory, req, res, next);
  }

  // Inventory
  @Get('inventory')
  getInventory(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(inventoryController.getInventory, req, res, next);
  }

  // Memberships
  @Get('memberships')
  getMemberships(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(membershipController.getMemberships, req, res, next);
  }

  @Post('memberships')
  createMembership(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(membershipController.createMembership, req, res, next);
  }

  @Put('memberships/:id')
  updateMembership(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(membershipController.updateMembership, req, res, next);
  }

  @Delete('memberships/:id')
  deleteMembership(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(membershipController.deleteMembership, req, res, next);
  }

  // Users
  @Get('users')
  getUsers(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(userController.getUsers, req, res, next);
  }

  @Post('users')
  createUser(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(userController.createUser, req, res, next);
  }

  @Get('users/:id')
  getUserDetail(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(userController.getUserDetail, req, res, next);
  }

  @Put('users/:id')
  updateUser(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(userController.updateUser, req, res, next);
  }

  @Put('users/:id/password')
  resetUserPassword(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(userController.resetUserPassword, req, res, next);
  }

  @Delete('users/:id')
  deleteUser(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(userController.deleteUser, req, res, next);
  }

  // Orders
  @Get('orders')
  getOrders(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(orderController.getOrders, req, res, next);
  }

  @Put('orders/:id/status')
  updateOrderStatus(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(orderController.updateOrderStatus, req, res, next);
  }

  @Put('orders/:id/payment')
  confirmPayment(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(orderController.confirmPayment, req, res, next);
  }

  @Post('orders/:id/return/approve')
  approveReturn(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(adminReturnController.approveReturn, req, res, next);
  }

  @Post('orders/:id/return/reject')
  rejectReturn(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(adminReturnController.rejectReturn, req, res, next);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('orders/:id/return/undo-approve')
  undoApproveReturn(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(adminReturnController.undoApproveReturn, req, res, next);
  }

  // Promotions
  @Get('promotions')
  getAdminPromotions(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(promotionController.getAdminPromotions, req, res, next);
  }

  @Post('promotions')
  createPromotion(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(promotionController.createPromotion, req, res, next);
  }

  @Put('promotions/:id')
  updatePromotion(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(promotionController.updatePromotion, req, res, next);
  }

  @Delete('promotions/:id')
  deletePromotion(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(promotionController.deletePromotion, req, res, next);
  }

  // Sales
  @Get('sales')
  getAllSalesAdmin(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(saleController.getAllSalesAdmin, req, res, next);
  }

  @Post('sales')
  createSaleAdmin(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(saleController.createSaleAdmin, req, res, next);
  }

  @Put('sales/:id')
  updateSaleAdmin(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(saleController.updateSaleAdmin, req, res, next);
  }

  @Put('sales/:id/status')
  toggleSaleStatus(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(saleController.toggleSaleStatus, req, res, next);
  }

  @Delete('sales/:id')
  removeSale(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(saleController.removeSale, req, res, next);
  }

  @Get('sales/:id/details')
  getSaleDetailsAdmin(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(saleController.getSaleDetailsAdmin, req, res, next);
  }

  // Vouchers
  @Get('vouchers')
  getAllVouchersAdmin(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(voucherController.getAllVouchersAdmin, req, res, next);
  }

  @Post('vouchers')
  createVoucherAdmin(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(voucherController.createVoucherAdmin, req, res, next);
  }

  @Put('vouchers/:id')
  updateVoucherAdmin(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(voucherController.updateVoucherAdmin, req, res, next);
  }

  @Put('vouchers/:id/status')
  toggleVoucherStatus(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(voucherController.toggleVoucherStatus, req, res, next);
  }

  @Delete('vouchers/:id')
  removeVoucher(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(voucherController.removeVoucher, req, res, next);
  }

  @Get('vouchers/:id/details')
  getVoucherDetails(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(voucherController.getVoucherDetails, req, res, next);
  }

  // Banners
  @Get('banners')
  getBanners(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(bannerController.getBanners, req, res, next);
  }

  @Post('banners')
  addBanner(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(bannerController.addBanner, req, res, next);
  }

  @Put('banners/:id')
  editBanner(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(bannerController.editBanner, req, res, next);
  }

  @Delete('banners/:id')
  removeBanner(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return run(bannerController.removeBanner, req, res, next);
  }
}
