# Clothing Shop Backend — NestJS 11

Backend của Clothing Shop được xây dựng bằng **NestJS 11**, sử dụng **Express làm HTTP adapter** thông qua `@nestjs/platform-express`. Express chỉ là lớp tiếp nhận HTTP; controller, nghiệp vụ, validation, phân quyền và truy cập dữ liệu thuộc kiến trúc NestJS.

## Kiến trúc hiện tại

- **99 route native NestJS**: `AdminController` 54 route, `StorefrontController` 42 route và `NotificationController` 3 route. Mọi handler gọi method của service được inject qua constructor.
- **Services theo domain**: nghiệp vụ admin, storefront, notification và các service dùng chung được tách khỏi controller.
- **Database**: PostgreSQL + Prisma 7. Runtime sử dụng `PrismaService` thông qua `PrismaModule` global.
- **Authentication/authorization**: `JwtAuthGuard`, `OptionalJwtAuthGuard`, `AdminGuard`, `GuestOrderAccessGuard`, `@CurrentUser()` và `@GuestEmail()`.
- **Validation**: Zod schema qua `ZodValidationPipe`.
- **Upload**: `FilesInterceptor` + `PersistImagesInterceptor`; file được kiểm tra loại và giới hạn trước khi lưu.
- **Exception handling**: `AllExceptionsFilter` sử dụng `HttpAdapterHost`.
- **Caching & Performance**: `RedisService` (`ioredis`) kết nối Redis khi có `REDIS_URL` với cơ chế tự động fallback in-memory store; `appCache` quản lý in-memory cache đồng bộ độc lập.
- **Realtime**: Socket.IO được quản lý qua `SocketService` và `SocketIoAdapter`.
- **Scheduled task**: `AutoCancelService` quản lý vòng đời job tự hủy đơn chưa thanh toán.

### Cấu trúc thư mục

```text
backend/
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Dữ liệu demo (reset dữ liệu — xem cảnh báo bên dưới)
├── src/
│   ├── main.ts                   # NestJS bootstrap + Express adapter
│   ├── app.module.ts             # Root module
│   ├── app.controller.ts         # Health endpoint
│   ├── admin/                    # AdminController, AdminModule và domain services
│   ├── storefront/               # StorefrontController, StorefrontModule và domain services
│   ├── notification/             # NotificationController, NotificationModule, service
│   ├── redis/                    # RedisModule, RedisService (ioredis + in-memory fallback)
│   ├── common/                   # Guards, decorators, filters, pipes, interceptors
│   ├── prisma/                   # Global PrismaModule và PrismaService
│   ├── socket/                   # SocketService, SocketModule, SocketIoAdapter
│   ├── services/                 # Order lifecycle, inventory, email/AI automation...
│   ├── payment/                  # Tích hợp cổng thanh toán VNPay và MoMo
│   ├── utils/                    # Email, shipping, cache, formatters, helpers
│   ├── constants/                # Order status và return policy
│   ├── types/                    # Domain types và Zod schemas
│   ├── public/images/            # Ảnh seed/static, phục vụ tại /public
│   └── __tests__/
│       ├── services/              # Unit tests cho NestJS domain services
│       ├── payment/               # Unit tests cho cổng thanh toán VNPay & MoMo
│       ├── pipes/                 # Unit tests cho ZodValidationPipe & schemas
│       ├── utils/                 # Unit tests cho utilities & helpers
│       ├── migration/             # Guardrails kiểm tra kiến trúc NestJS & SQL safety
│       └── prisma/                # Tests liên quan seed/database
├── Dockerfile                     # Multi-stage Docker build
├── .dockerignore
├── scripts/                       # Source architecture checker và no-any checker
├── uploads/                       # Ảnh tải lên runtime; không commit file upload
├── prisma.config.ts
├── nest-cli.json
├── package.json
└── tsconfig.build.json
```

## Yêu cầu

- Node.js 22 LTS (CI sử dụng Node 22).
- npm tương thích với Node.js đang dùng.
- PostgreSQL 14+.

## Cài đặt và chạy local

```bash
cd backend
cp .env.example .env
```

Cập nhật `DATABASE_URL` và các secret/URL cần thiết trong `.env` trước khi cài dependencies. Sau đó:

```bash
npm ci --legacy-peer-deps
npm run db:generate
npm run db:push
npm run start:dev
```

Backend mặc định chạy tại `http://localhost:5000`; API có global prefix `/api` và health endpoint ở `/`.

### Seed dữ liệu demo

```bash
npm run seed
```

**Cảnh báo:** seed hiện xóa và tạo lại dữ liệu demo trong database được cấu hình. Chỉ chạy trên database local/demo mới tạo hoặc khi chủ động muốn reset dữ liệu. Không chạy trên database production hoặc database chứa dữ liệu cần giữ.

## Biến môi trường

Các tên biến và giá trị mẫu đầy đủ nằm trong [`.env.example`](.env.example).

| Biến | Mục đích |
|---|---|
| `PORT` | Cổng HTTP, mặc định `5000` |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Chuỗi kết nối Redis (tùy chọn, tự động fallback in-memory nếu không cấu hình) |
| `FRONTEND_URL` | Origin frontend được phép qua CORS (nhiều origin phân tách bằng dấu phẩy) |
| `STOREFRONT_URL` | URL storefront dùng cho link quay về sau thanh toán MoMo (mặc định: origin đầu tiên của `FRONTEND_URL`) |
| `BACKEND_URL` | URL backend public dùng cho callback/webhook |
| `JWT_SECRET` | Ký access token và xác thực request |
| `JWT_REFRESH_SECRET` | Ký refresh token |
| `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY` | Cấu hình MoMo |
| `VNP_TMNCODE`, `VNP_HASHSECRET`, `VNP_URL`, `VNP_RETURNURL` | Cấu hình VNPay |
| `EMAIL_USER`, `BREVO_API_KEY` | Gửi email giao dịch/OTP qua Brevo |
| `GOOGLE_API_KEY` | Google Gemini chatbot |
| `STRICT_ENV_CHECK` | Bật kiểm tra fail-fast các biến quan trọng khi khởi động |

Không commit `.env`, secret, API key hay dữ liệu upload.

## Scripts

| Lệnh | Mục đích |
|---|---|
| `npm run start:dev` | Chạy NestJS ở chế độ watch |
| `npm run build` | Build production bằng Nest CLI |
| `npm run start:prod` | Chạy bundle đã build (`dist/main.js`) |
| `npm run start` | Chạy entrypoint TypeScript bằng `tsx` |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Đồng bộ schema vào database hiện tại |
| `npm run db:studio` | Mở Prisma Studio |
| `npm run seed` | Reset và nạp dữ liệu demo |
| `npm test -- --runInBand` | Chạy Jest tests |
| `npm run test:coverage` | Chạy Jest với coverage |
| `npm run typecheck` | Type-check phần production build |
| `npm run check:no-any` | Kiểm tra `any` tường minh theo quy tắc repo |
| `npm run check:nestjs-migration` | Kiểm tra 99 route/service và guardrails kiến trúc |

## Kiểm thử và phạm vi xác minh

Chạy đủ các bước sau trước khi phát hành:

```bash
npm ci --legacy-peer-deps
npm run db:generate
npm run check:nestjs-migration
npm run build
npm run typecheck
npm test -- --runInBand
npm run check:no-any
```