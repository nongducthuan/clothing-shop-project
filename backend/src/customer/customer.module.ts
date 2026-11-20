import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerCatalogService } from './services/customer-catalog.service';
import { CustomerChatService } from './services/customer-chat.service';
import { CustomerProductService } from './services/customer-product.service';
import { CustomerPromotionService } from './services/customer-promotion.service';
import { CustomerVoucherService } from './services/customer-voucher.service';
import { CustomerAuthService } from './services/customer-auth.service';
import { CustomerOrderLookupService } from './services/customer-order-lookup.service';
import { CustomerOrderService } from './services/customer-order.service';
import { CustomerReturnService } from './services/customer-return.service';
import { CustomerPaymentService } from './services/customer-payment.service';
import { AiService } from '../services/aiService';

@Module({
  controllers: [CustomerController],
  providers: [CustomerCatalogService, CustomerChatService, CustomerProductService, CustomerPromotionService, CustomerVoucherService, CustomerAuthService, CustomerOrderLookupService, CustomerOrderService, CustomerReturnService, CustomerPaymentService, AiService],
})
export class CustomerModule {}
