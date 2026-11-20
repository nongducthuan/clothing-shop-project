import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminStatsService } from './services/admin-stats.service';
import { AdminCatalogService } from './services/admin-catalog.service';
import { AdminBannerService } from './services/admin-banner.service';
import { AdminProductVariantService } from './services/admin-product-variant.service';
import { AdminCategoryService } from './services/admin-category.service';
import { AdminMembershipService } from './services/admin-membership.service';
import { AdminPromotionService } from './services/admin-promotion.service';
import { AdminProductService } from './services/admin-product.service';
import { AdminUserService } from './services/admin-user.service';
import { AdminSaleService } from './services/admin-sale.service';
import { AdminVoucherService } from './services/admin-voucher.service';
import { AdminOrderService } from './services/admin-order.service';
import { AdminReturnService } from './services/admin-return.service';

@Module({
  controllers: [AdminController],
  providers: [
    AdminStatsService,
    AdminBannerService,
    AdminProductVariantService,
    AdminCategoryService,
    AdminMembershipService,
    AdminCatalogService,
    AdminPromotionService,
    AdminProductService,
    AdminUserService,
    AdminSaleService,
    AdminVoucherService,
    AdminOrderService,
    AdminReturnService,
  ],
})
export class AdminModule {}
