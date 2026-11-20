import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Body,
  Param,
  Query,
  HttpCode,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminStatsService } from './services/admin-stats.service';
import { AdminCatalogService, BannerPayload, ColorPayload, SizePayload, CategoryPayload, MembershipPayload } from './services/admin-catalog.service';
import { AdminPromotionService, PromotionPayload } from './services/admin-promotion.service';
import { AdminProductService, AdminProductPayload, AdminProductQuery } from './services/admin-product.service';
import { AdminUserService } from './services/admin-user.service';
import { AdminSaleService, SalePayload } from './services/admin-sale.service';
import { AdminVoucherService, VoucherPayload } from './services/admin-voucher.service';

import { AdminOrderService } from './services/admin-order.service';
import { AdminReturnService } from './services/admin-return.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminStatsService: AdminStatsService,
    private readonly adminCatalogService: AdminCatalogService,
    private readonly adminPromotionService: AdminPromotionService,
    private readonly adminProductService: AdminProductService,
    private readonly adminUserService: AdminUserService,
    private readonly adminSaleService: AdminSaleService,
    private readonly adminVoucherService: AdminVoucherService,
    private readonly adminOrderService: AdminOrderService,
    private readonly adminReturnService: AdminReturnService,
  ) {}

  // Stats – native NestJS controller/service flow.
  @Get('stats')
  getAdminStats() {
    return this.adminStatsService.getAdminStats();
  }

  // Products
  @Get('products')
  getProducts(@Query() query: AdminProductQuery) {
    return this.adminProductService.getProducts(query);
  }

  @Post('products')
  addProduct(@Body() body: AdminProductPayload) {
    return this.adminProductService.addProduct(body);
  }

  @Get('products/:id')
  getProductDetail(@Param('id') id: string) {
    return this.adminProductService.getProductDetail(id);
  }

  @Put('products/:id')
  editProduct(@Param('id') id: string, @Body() body: AdminProductPayload) {
    return this.adminProductService.editProduct(id, body);
  }

  @Delete('products/:id')
  removeProduct(@Param('id') id: string) {
    return this.adminProductService.removeProduct(id);
  }

  // Colors & Sizes
  @Post('products/:productId/colors')
  @HttpCode(200)
  addColor(@Param('productId') productId: string, @Body() body: ColorPayload) {
    return this.adminCatalogService.addColor(productId, body);
  }

  @Delete('colors/:id')
  removeColor(@Param('id') id: string) {
    return this.adminCatalogService.removeColor(id);
  }

  @Post('colors/:colorId/sizes')
  @HttpCode(200)
  addSize(@Param('colorId') colorId: string, @Body() body: SizePayload) {
    return this.adminCatalogService.addSize(colorId, body);
  }

  @Put('sizes/:id')
  updateSize(@Param('id') id: string, @Body('stock') stock: number | string) {
    return this.adminCatalogService.updateSize(id, stock);
  }

  @Delete('sizes/:id')
  removeSize(@Param('id') id: string) {
    return this.adminCatalogService.removeSize(id);
  }

  // Categories
  @Get('categories')
  getCategories() {
    return this.adminCatalogService.getCategories();
  }

  @Post('categories')
  createCategory(@Body() body: CategoryPayload) {
    return this.adminCatalogService.createCategory(body);
  }

  @Get('categories/recommend')
  getCategoryRecommendations(@Query('gender') gender?: string) {
    return this.adminCatalogService.getCategoryRecommendations(gender);
  }

  @Get('categories/:id/images')
  getCategoryImages(@Param('id') id: string) {
    return this.adminCatalogService.getCategoryImages(id);
  }

  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: CategoryPayload) {
    return this.adminCatalogService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.adminCatalogService.deleteCategory(id);
  }

  // Inventory
  @Get('inventory')
  getInventory() {
    return this.adminCatalogService.getInventory();
  }

  // Memberships
  @Get('memberships')
  getMemberships() {
    return this.adminCatalogService.getMemberships();
  }

  @Post('memberships')
  createMembership(@Body() body: MembershipPayload) {
    return this.adminCatalogService.createMembership(body);
  }

  @Put('memberships/:id')
  updateMembership(@Param('id') id: string, @Body() body: MembershipPayload) {
    return this.adminCatalogService.updateMembership(id, body);
  }

  @Delete('memberships/:id')
  deleteMembership(@Param('id') id: string) {
    return this.adminCatalogService.deleteMembership(id);
  }

  // Users
  @Get('users')
  getUsers(@Query() query: { search?: string; role?: string; page?: string; limit?: string }) {
    return this.adminUserService.getUsers(query);
  }

  @Post('users')
  createUser(@Body() body: Record<string, unknown>) {
    return this.adminUserService.createUser(body);
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminUserService.getUserDetail(id);
  }

  @Put('users/:id')
  updateUser(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: { id: number }) {
    return this.adminUserService.updateUser(id, user?.id, body);
  }

  @Put('users/:id/password')
  resetUserPassword(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminUserService.resetUserPassword(id, body);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string, @CurrentUser() user: { id: number }) {
    return this.adminUserService.deleteUser(id, user?.id);
  }

  // Orders
  @Get('orders')
  getOrders(@Query() query: { page?: string; limit?: string; tab?: string; status?: string }) {
    return this.adminOrderService.getOrders(query);
  }

  @Put('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminOrderService.updateOrderStatus(id, status);
  }

  @Put('orders/:id/payment')
  confirmPayment(@Param('id') id: string, @Body('payment_status') paymentStatus: unknown, @CurrentUser() user?: { id: number }) {
    return this.adminOrderService.confirmPayment(id, paymentStatus, user?.id);
  }

  @Post('orders/:id/return/approve')
  @HttpCode(200)
  approveReturn(@Param('id') id: string) {
    return this.adminReturnService.approveReturn(id);
  }

  @Post('orders/:id/return/reject')
  @HttpCode(200)
  rejectReturn(@Param('id') id: string, @Body('adminNote') adminNote?: string) {
    return this.adminReturnService.rejectReturn(id, adminNote);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('orders/:id/return/undo-approve')
  @HttpCode(200)
  undoApproveReturn(@Param('id') id: string, @Body() body: { stock_returned?: boolean; money_refunded?: boolean }, @CurrentUser() user?: { id: number }) {
    return this.adminReturnService.undoApproveReturn(id, body, user?.id);
  }

  // Promotions
  @Get('promotions')
  getAdminPromotions() {
    return this.adminPromotionService.getAdminPromotions();
  }

  @Post('promotions')
  createPromotion(@Body() body: PromotionPayload) {
    return this.adminPromotionService.createPromotion(body);
  }

  @Put('promotions/:id')
  updatePromotion(@Param('id') id: string, @Body() body: PromotionPayload) {
    return this.adminPromotionService.updatePromotion(id, body);
  }

  @Delete('promotions/:id')
  deletePromotion(@Param('id') id: string) {
    return this.adminPromotionService.deletePromotion(id);
  }

  // Sales
  @Get('sales')
  getAllSalesAdmin() {
    return this.adminSaleService.findAll();
  }

  @Post('sales')
  createSaleAdmin(@Body() body: SalePayload) {
    return this.adminSaleService.create(body);
  }

  @Put('sales/:id')
  updateSaleAdmin(@Param('id') id: string, @Body() body: SalePayload) {
    return this.adminSaleService.update(id, body);
  }

  @Put('sales/:id/status')
  toggleSaleStatus(@Param('id') id: string, @Body('status') status: unknown) {
    return this.adminSaleService.toggleStatus(id, status);
  }

  @Delete('sales/:id')
  removeSale(@Param('id') id: string) {
    return this.adminSaleService.remove(id);
  }

  @Get('sales/:id/details')
  getSaleDetailsAdmin(@Param('id') id: string, @Query('type') type?: string) {
    return this.adminSaleService.getDetails(id, type);
  }

  // Vouchers
  @Get('vouchers')
  getAllVouchersAdmin(@Query('includeDeleted') includeDeleted?: string) {
    return this.adminVoucherService.findAll(includeDeleted === 'true');
  }

  @Post('vouchers')
  createVoucherAdmin(@Body() body: VoucherPayload) {
    return this.adminVoucherService.create(body);
  }

  @Put('vouchers/:id')
  updateVoucherAdmin(@Param('id') id: string, @Body() body: VoucherPayload) {
    return this.adminVoucherService.update(id, body);
  }

  @Put('vouchers/:id/status')
  toggleVoucherStatus(@Param('id') id: string, @Body('status') status: unknown) {
    return this.adminVoucherService.toggleStatus(id, status);
  }

  @Delete('vouchers/:id')
  removeVoucher(@Param('id') id: string) {
    return this.adminVoucherService.remove(id);
  }

  @Get('vouchers/:id/details')
  getVoucherDetails(@Param('id') id: string) {
    return this.adminVoucherService.getDetails(id);
  }

  // Banners
  @Get('banners')
  getBanners() {
    return this.adminCatalogService.getBanners();
  }

  @Post('banners')
  addBanner(@Body() body: BannerPayload) {
    return this.adminCatalogService.addBanner(body);
  }

  @Put('banners/:id')
  editBanner(@Param('id') id: string, @Body() body: BannerPayload) {
    return this.adminCatalogService.editBanner(id, body);
  }

  @Delete('banners/:id')
  removeBanner(@Param('id') id: string) {
    return this.adminCatalogService.removeBanner(id);
  }
}
