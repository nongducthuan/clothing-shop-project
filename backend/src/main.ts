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
import { NestExpressApplication } from '@nestjs/platform-express';

checkCriticalEnv();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Trust proxy for Render deployment
  app.set('trust proxy', 1);

  // Helmet
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS
  const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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
  app.useWebSocketAdapter(new SocketIoAdapter(app, allowedOrigins));

  const PORT = process.env.PORT || 5000;
  await app.listen(PORT);

  // Attach socket.io listener to http server
  const socketService = app.get(SocketService);
  socketService.init(app.getHttpServer(), allowedOrigins);

  console.log(`Server is running at port ${PORT}`);

}

bootstrap();
