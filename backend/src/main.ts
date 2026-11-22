import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SocketIoAdapter } from './socket/socket-io.adapter';
import { SocketService } from './socket/socket.service';
import { checkCriticalEnv } from './utils/envCheck';
import helmet from 'helmet';
import path from 'path';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

checkCriticalEnv();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Trust proxy for Render deployment
  app.set('trust proxy', 1);

  // Helmet
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS
  const configuredFrontendUrls = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...configuredFrontendUrls,
  ];

  const isOriginAllowed = (origin?: string): boolean => {
    if (!origin) return true;
    const cleanOrigin = origin.trim().replace(/\/+$/, '');
    if (allowedOrigins.some((allowed) => allowed === cleanOrigin)) {
      return true;
    }
    try {
      const url = new URL(cleanOrigin);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;
      if (url.hostname.endsWith('.onrender.com') || url.hostname.endsWith('.vercel.app')) return true;
    } catch {
      return false;
    }
    return false;
  };

  const corsOriginCallback = (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  };

  app.enableCors({
    origin: corsOriginCallback,
    credentials: true,
  });

  // Static files
  app.useStaticAssets(path.resolve(process.cwd(), 'src/public'), { prefix: '/public' });
  app.useStaticAssets(path.resolve(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));

  // Global prefix for all API routes
  app.setGlobalPrefix('api');

  // Socket.io adapter & initialization
  app.useWebSocketAdapter(new SocketIoAdapter(app, corsOriginCallback));

  const PORT = process.env.PORT || 5000;
  await app.listen(PORT);

  // Attach socket.io listener to http server
  const socketService = app.get(SocketService);
  socketService.init(app.getHttpServer(), corsOriginCallback);

  new Logger('Bootstrap').log(`Server is running at port ${PORT}`);
}

bootstrap();
