import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminStatsService } from './services/admin-stats.service';
import { AdminCatalogService } from './services/admin-catalog.service';
import { AdminPromotionService } from './services/admin-promotion.service';
import { AdminProductService } from './services/admin-product.service';
import { AdminUserService } from './services/admin-user.service';
import { AdminSaleService } from './services/admin-sale.service';
import { AdminVoucherService } from './services/admin-voucher.service';
import { AdminOrderService } from './services/admin-order.service';
import { AdminReturnService } from './services/admin-return.service';

@Module({
  controllers: [AdminController],
  providers: [AdminStatsService, AdminCatalogService, AdminPromotionService, AdminProductService, AdminUserService, AdminSaleService, AdminVoucherService, AdminOrderService, AdminReturnService],
})
export class AdminModule {}
