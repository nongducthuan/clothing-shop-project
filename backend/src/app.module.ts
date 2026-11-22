import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { SocketModule } from './socket/socket.module';
import { AdminModule } from './admin/admin.module';
import { StorefrontModule } from './storefront/storefront.module';
import { NotificationModule } from './notification/notification.module';
import { AppController } from './app.controller';
import { AutoCancelService } from './services/autoCancelService';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    RedisModule,
    SocketModule,
    AdminModule,
    StorefrontModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    AutoCancelService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
