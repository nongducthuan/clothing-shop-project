import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller';
import { StorefrontCatalogService } from './services/storefront-catalog.service';
import { StorefrontChatService } from './services/storefront-chat.service';
import { StorefrontProductService } from './services/storefront-product.service';
import { StorefrontPromotionService } from './services/storefront-promotion.service';
import { StorefrontVoucherService } from './services/storefront-voucher.service';
import { StorefrontAuthService } from './services/storefront-auth.service';
import { StorefrontOrderLookupService } from './services/storefront-order-lookup.service';
import { StorefrontOrderService } from './services/storefront-order.service';
import { StorefrontReturnService } from './services/storefront-return.service';
import { StorefrontPaymentService } from './services/storefront-payment.service';
import { AiService } from '../services/aiService';

@Module({
  controllers: [StorefrontController],
  providers: [
    StorefrontCatalogService,
    StorefrontChatService,
    StorefrontProductService,
    StorefrontPromotionService,
    StorefrontVoucherService,
    StorefrontAuthService,
    StorefrontOrderLookupService,
    StorefrontOrderService,
    StorefrontReturnService,
    StorefrontPaymentService,
    AiService,
  ],
})
export class StorefrontModule {}
