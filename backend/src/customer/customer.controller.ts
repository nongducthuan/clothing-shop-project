import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  UseInterceptors,
  Param,
  Query,
  Headers,
  HttpCode,
  UploadedFiles,
  Body,
  BadRequestException,
  Ip,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FilesInterceptor } from '@nestjs/platform-express';
import multer from 'multer';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { GuestOrderAccessGuard } from '../common/guards/guest-order-access.guard';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PersistImagesInterceptor } from '../common/interceptors/persist-images.interceptor';
import { CustomerCatalogService } from './services/customer-catalog.service';
import { CustomerChatService, ChatPayload } from './services/customer-chat.service';
import { CustomerProductService } from './services/customer-product.service';
import { CustomerPromotionService } from './services/customer-promotion.service';
import { CustomerVoucherService } from './services/customer-voucher.service';
import { CustomerAuthService } from './services/customer-auth.service';
import { CustomerOrderLookupService } from './services/customer-order-lookup.service';
import { CustomerOrderService } from './services/customer-order.service';
import { CustomerReturnService, PersistedReturnImage } from './services/customer-return.service';
import { CustomerPaymentService } from './services/customer-payment.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GuestEmail } from '../common/decorators/guest-email.decorator';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  applyVoucherSchema,
  createOrderSchema,
} from '../types/schemas';


@Controller()
export class CustomerController {
  constructor(
    private readonly customerCatalogService: CustomerCatalogService,
    private readonly customerChatService: CustomerChatService,
    private readonly customerProductService: CustomerProductService,
    private readonly customerPromotionService: CustomerPromotionService,
    private readonly customerVoucherService: CustomerVoucherService,
    private readonly customerAuthService: CustomerAuthService,
    private readonly customerOrderLookupService: CustomerOrderLookupService,
    private readonly customerOrderService: CustomerOrderService,
    private readonly customerReturnService: CustomerReturnService,
    private readonly customerPaymentService: CustomerPaymentService,
  ) {}
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  @Post('auth/register')
  register(@Body(new ZodValidationPipe(registerSchema)) body: { name?: string; email?: string; phone?: string; password?: string }) {
    return this.customerAuthService.register(body);
  }

  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @Post('auth/login')
  @HttpCode(200)
  login(@Body(new ZodValidationPipe(loginSchema)) body: { identifier?: string; password?: string }) {
    return this.customerAuthService.login(body);
  }

  @Post('auth/refresh')
  @HttpCode(200)
  refreshToken(@Body() body: { refreshToken?: string }) {
    return this.customerAuthService.refreshToken(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('auth/logout')
  @HttpCode(200)
  logout(@CurrentUser() user?: { id: number }) {
    return this.customerAuthService.logout(user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('auth/me')
  getMe(@CurrentUser() user?: { id: number }) {
    return this.customerAuthService.getMe(user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('auth/profile')
  updateProfile(@Body() body: { phone?: string }, @CurrentUser() user?: Record<string, unknown> & { id?: number }) {
    return this.customerAuthService.updateProfile(user?.id, body, user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('auth/password')
  changePassword(
    @Body(new ZodValidationPipe(changePasswordSchema)) body: { currentPassword?: string; newPassword?: string },
    @CurrentUser() user?: { id: number },
  ) {
    return this.customerAuthService.changePassword(user?.id, body);
  }

  // Banners
  @Get('banners')
  getBanners() {
    return this.customerCatalogService.getBanners();
  }

  // Categories
  @Get('categories')
  getCategories() {
    return this.customerCatalogService.getCategories();
  }

  @Get('categories/preview')
  getCategoriesWithPreview() {
    return this.customerCatalogService.getCategoriesWithPreview();
  }

  @Get('categories/recommend')
  getRecommendCategories(@Query('gender') gender?: string) {
    return this.customerCatalogService.getRecommendCategories(gender);
  }

  // Chat
  @Post('chat')
  @HttpCode(200)
  handleChat(
    @Body() body: ChatPayload,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('language') languageHeader?: string,
  ) {
    return this.customerChatService.handleChat(body, acceptLanguage, languageHeader);
  }

  @Post('chat/history')
  @HttpCode(200)
  handleChatWithHistory(
    @Body() body: ChatPayload,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('language') languageHeader?: string,
  ) {
    return this.customerChatService.handleChatWithHistory(body, acceptLanguage, languageHeader);
  }

  @Delete('chat/history')
  clearChatHistory(@Body() body: ChatPayload) {
    return this.customerChatService.clearChatHistory(body);
  }

  // Memberships
  @Get('memberships')
  getMemberships() {
    return this.customerCatalogService.getMemberships();
  }

  // Order OTP lookup
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @Post('orders/otp/send')
  @HttpCode(200)
  sendOtpController(@Body() body: { email?: string; lang?: string; language?: string }, @Headers('accept-language') acceptLanguage?: string, @Headers('language') languageHeader?: string) {
    return this.customerOrderLookupService.sendOtp(body.email, body.lang || body.language, acceptLanguage, languageHeader);
  }

  @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
  @Post('orders/otp/verify')
  @HttpCode(200)
  verifyOtpAndGetOrders(@Body() body: { email?: string; code?: string }) {
    return this.customerOrderLookupService.verifyOtp(body.email, body.code);
  }

  // Orders
  @UseGuards(OptionalJwtAuthGuard)
  @Post('orders')
  createOrderController(
    @Body(new ZodValidationPipe(createOrderSchema)) body: { address?: string; items?: import('../types/orderTypes').OrderRequestItem[]; phone?: string; name?: string; email?: string; payment_method?: string; voucher_id?: string | number },
    @CurrentUser() user?: import('../common/interfaces/jwt-payload.interface').JwtPayload,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('language') language?: string,
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Ip() ip?: string,
  ) {
    return this.customerOrderService.createOrder(body, user, { acceptLanguage, language, forwardedFor, remoteAddress: ip });
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders')
  getOrders(@CurrentUser() user?: { id: number }) {
    return this.customerOrderService.getOrders(user?.id);
  }

  @UseGuards(OptionalJwtAuthGuard, GuestOrderAccessGuard)
  @Put('orders/status')
  changeOrderStatus(@Body() body: { order_id?: string | number; new_status?: string }, @CurrentUser() user?: import('../common/interfaces/jwt-payload.interface').JwtPayload, @GuestEmail() guestEmail?: string) {
    return this.customerOrderService.changeOrderStatus(body, user, guestEmail);
  }

  @UseGuards(OptionalJwtAuthGuard, GuestOrderAccessGuard)
  @Post('orders/:id/repay')
  @HttpCode(200)
  repayMoMoController(@Param('id') id: string, @Body() body: { new_payment_method?: string }, @CurrentUser() user?: import('../common/interfaces/jwt-payload.interface').JwtPayload, @GuestEmail() guestEmail?: string, @Headers('x-forwarded-for') forwardedFor?: string, @Ip() ip?: string) {
    return this.customerPaymentService.repayMoMo(id, body, user, guestEmail, forwardedFor, ip);
  }

  @UseGuards(OptionalJwtAuthGuard, GuestOrderAccessGuard)
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 5 },
      fileFilter: (_request, file, callback) => {
        const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
        const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
        const extension = file.originalname.split('.').pop()?.toLowerCase();
        if (!allowedMimeTypes.has(file.mimetype) || !extension || !allowedExtensions.has(`.${extension}`)) {
          callback(new BadRequestException('Only JPEG, PNG, and WebP images are allowed.'), false);
          return;
        }
        callback(null, true);
      },
    }),
    PersistImagesInterceptor,
  )
  @Post('orders/:id/return')
  @HttpCode(200)
  submitReturnRequest(
    @Param('id') id: string,
    @Body() body: { reason_code?: string; description?: string; returnItems?: unknown; refund_bank_info?: unknown; bankInfo?: unknown },
    @UploadedFiles() files: PersistedReturnImage[] = [],
    @CurrentUser() user?: import('../common/interfaces/jwt-payload.interface').JwtPayload,
    @GuestEmail() guestEmail?: string,
  ) {
    return this.customerReturnService.submitReturnRequest(id, body, files, user, guestEmail);
  }

  @UseGuards(OptionalJwtAuthGuard, GuestOrderAccessGuard)
  @Delete('orders/:id/return')
  cancelReturnRequest(@Param('id') id: string, @CurrentUser() user?: import('../common/interfaces/jwt-payload.interface').JwtPayload, @GuestEmail() guestEmail?: string) {
    return this.customerReturnService.cancelReturnRequest(id, user, guestEmail);
  }

  // Payment Webhooks & Callbacks
  @Post('orders/momo-callback')
  @HttpCode(204)
  momoCallback(@Body() body: Record<string, unknown>) {
    return this.customerPaymentService.momoCallback(body);
  }

  @Get('orders/momo-return')
  momoReturn(@Query() query: Record<string, unknown>) {
    return this.customerPaymentService.momoReturn(query);
  }

  @Get('orders/vnpay-ipn')
  vnpayIpnGet(@Query() query: Record<string, unknown>) {
    return this.customerPaymentService.vnpayIpn(query);
  }

  @Post('orders/vnpay-ipn')
  @HttpCode(200)
  vnpayIpnPost(@Query() query: Record<string, unknown>) {
    return this.customerPaymentService.vnpayIpn(query);
  }

  @Get('orders/vnpay-return')
  vnpayReturn(@Query() query: Record<string, unknown>) {
    return this.customerPaymentService.vnpayReturn(query);
  }

  // Products
  @Get('products')
  getProducts(@Query() query: { category_id?: string; gender?: string; page?: string; limit?: string }) {
    return this.customerProductService.getProducts(query);
  }

  @Get('products/search')
  searchProducts(@Query() query: { q?: string; gender?: string; category?: string; page?: string; limit?: string }) {
    return this.customerProductService.searchProducts(query);
  }

  @Get('products/representative')
  getRepresentative(@Query('category_id') categoryId?: string) {
    return this.customerProductService.getRepresentative(categoryId);
  }

  @Post('products/prices')
  @HttpCode(200)
  getProductPrices(@Body() body: { productIds?: unknown }) {
    return this.customerProductService.getProductPrices(body);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('products/recommendations/:userId')
  getRecommendations(@CurrentUser() user?: { id: number }) {
    return this.customerProductService.getRecommendations(user?.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('products/:id')
  getProduct(@Param('id') id: string, @CurrentUser() user?: { id: number }) {
    return this.customerProductService.getProduct(id, user?.id);
  }

  @Get('products/:id/options')
  getProductOptions(@Param('id') id: string) {
    return this.customerProductService.getProductOptions(id);
  }

  @Get('products/:id/details')
  getProductDetail(@Param('id') id: string) {
    return this.customerCatalogService.getProductDetail(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('products/interaction')
  @HttpCode(200)
  logInteraction(@Body() body: { productId?: number | string; type?: string }, @CurrentUser() user?: { id: number }) {
    return this.customerProductService.logInteraction(user?.id, body);
  }

  // Promotions
  @Get('promotions')
  getActivePromotions() {
    return this.customerPromotionService.getActivePromotions();
  }

  @Post('promotions/calculate')
  @HttpCode(200)
  calculateCart(@Body() body: { cartItems?: unknown }) {
    return this.customerPromotionService.calculateCart(body);
  }

  // Sales
  @Get('sales')
  getActiveSales() {
    return this.customerCatalogService.getActiveSales();
  }

  // Vouchers
  @Get('vouchers')
  getActiveVouchers(@Query() query: { category_id?: string; product_id?: string }) {
    return this.customerVoucherService.getActiveVouchers(query);
  }

  @Post('vouchers/apply')
  @HttpCode(200)
  applyVoucher(@Body(new ZodValidationPipe(applyVoucherSchema)) validatedBody: {
    code?: string; orderTotal?: number | string; subtotal?: number | string; membershipDiscountableSubtotal?: number | string; cartItems?: unknown;
  }) {
    return this.customerVoucherService.applyVoucher(validatedBody);
  }
}
