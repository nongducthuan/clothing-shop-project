# NestJS Backend – Clothing Shop

Backend đã được migrate từ Express sang **NestJS**, giữ nguyên 100% business logic, chỉ thay đổi framework layer.

## Cấu trúc

```
nestjs-backend/
├── src/
│   ├── main.ts                    # Entry point (thay thế index.ts)
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # GET / health check
│   ├── prisma/
│   │   ├── prisma.module.ts       # Global Prisma module
│   │   └── prisma.service.ts      # PrismaService (extends PrismaClient)
│   ├── common/
│   │   ├── guards/                # JWT, Admin, GuestOrderAccess guards
│   │   ├── filters/               # AllExceptionsFilter (global error handler)
│   │   ├── pipes/                 # ZodValidationPipe
│   │   ├── interceptors/          # PersistImagesInterceptor
│   │   └── decorators/            # @CurrentUser, @GuestEmail
│   ├── socket/
│   │   ├── socket.module.ts
│   │   ├── socket.service.ts      # SocketService (sendNotification...)
│   │   └── socket-io.adapter.ts   # Custom SocketIo adapter
│   ├── admin/
│   │   ├── admin.controller.ts    # Tất cả admin routes
│   │   └── admin.module.ts
│   ├── customer/
│   │   ├── customer.controller.ts # Tất cả customer routes
│   │   └── customer.module.ts
│   ├── notification/
│   │   ├── notification.controller.ts
│   │   └── notification.module.ts
│   ├── controllers/               # Express controllers (giữ nguyên, dùng lại)
│   ├── services/                  # Business logic services (giữ nguyên)
│   ├── middleware/                # Express middleware (giữ nguyên)
│   ├── utils/                     # Utilities (giữ nguyên)
│   ├── constants/                 # Constants (giữ nguyên)
│   └── types/                     # Types & Zod schemas (giữ nguyên)
├── prisma/                        # Prisma schema & seed
├── uploads/                       # File uploads
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## Scripts

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start

# Database
npm run db:generate
npm run db:push
npm run db:studio
npm run seed

# Tests
npm test
npm run test:coverage

# TypeScript check
npm run typecheck
```

## So sánh với Express

| Express | NestJS |
|---------|--------|
| `src/index.ts` | `src/main.ts` |
| `express-rate-limit` | `@nestjs/throttler` |
| `authenticateToken` middleware | `JwtAuthGuard` |
| `requireAdmin` middleware | `AdminGuard` |
| `globalErrorHandler` | `AllExceptionsFilter` |
| `validate(schema)` middleware | `ZodValidationPipe` |
| `initSocket()` | `SocketService.init()` + `SocketIoAdapter` |
| Singleton `prisma` import | `PrismaService` (DI) |

## Notes

- Business logic **không thay đổi** – controllers, services, utils giữ nguyên từ Express
- NestJS controllers gọi thẳng Express controller functions qua `run(fn, req, res, next)`
- Rate limiting dùng `@nestjs/throttler` thay `express-rate-limit`
- Socket.io khởi tạo qua `SocketService.init()` trong `main.ts` sau khi app listen
