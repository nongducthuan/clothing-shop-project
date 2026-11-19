# NestJS Backend – Clothing Shop

Backend đã được migrate từ Express sang **NestJS**, giữ nguyên 100% business logic, chỉ thay đổi framework layer.

## Cấu trúc

```
backend/
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
│   ├── controllers/               # Controllers nghiệp vụ (14 admin, 14 customer)
│   ├── services/                  # 12 services nghiệp vụ
│   ├── middleware/                # Upload & Validate middleware (xác thực/phân quyền dùng common/guards)
│   ├── utils/                     # 14 utilities (PostgreSQL, email, socket, MoMo, VNPay...)
│   ├── constants/                 # Constants (order status, return policy)
│   └── types/                     # Types & Zod schemas (đồng bộ validation)
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

# Quality & Type check
npm run typecheck
npm run check:no-any
```

## So sánh với Express

| Express | NestJS |
|---------|--------|
| `src/index.ts` | `src/main.ts` |
| `express-rate-limit` | `@nestjs/throttler` |
| `authenticateToken` middleware | `JwtAuthGuard` (đã migrate hoàn toàn, loại bỏ authMiddleware) |
| `requireAdmin` middleware | `AdminGuard` |
| `guestOrderAccess` middleware | `GuestOrderAccessGuard` |
| `globalErrorHandler` | `AllExceptionsFilter` |
| `validate(schema)` middleware | `ZodValidationPipe` |
| `initSocket()` | `SocketService.init()` + `SocketIoAdapter` |
| Singleton `prisma` import | `PrismaService` (DI) |

## Notes

- Business logic và luồng nghiệp vụ được bảo toàn – controllers, services, utils được kế thừa và tinh gọn cho NestJS
- Các middleware xác thực cũ của Express (`authMiddleware.ts`, `errorMiddleware.ts`, `guestOrderAccessMiddleware.ts`) và kết nối MariaDB cũ (`mariadbPool.ts`) đã được loại bỏ hoàn toàn, hệ thống chạy thuần NestJS Guards/Filters và Prisma PostgreSQL adapter
- NestJS controllers gọi thẳng controller functions qua `run(fn, req, res, next)`
- Rate limiting dùng `@nestjs/throttler` thay `express-rate-limit`
- Socket.io khởi tạo qua `SocketService.init()` trong `main.ts` sau khi app listen
