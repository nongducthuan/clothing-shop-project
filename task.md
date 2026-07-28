# Task: Migrate Server JS → TypeScript + Prisma ORM

## Phase 1: Setup
- [x] Đọc toàn bộ codebase
- [x] Cài packages (typescript, tsx, @types/*, prisma, @prisma/client, @prisma/adapter-mariadb, mariadb)
- [x] Tạo tsconfig.json
- [x] Tạo prisma/schema.prisma từ database/schema.sql (20+ tables)
- [x] Generate Prisma Client (`npx prisma generate` thành công)
- [x] Tạo prisma/client.ts singleton (dùng MariaDB adapter cho Prisma v7)
- [x] Tạo prisma.config.ts
- [x] Thêm DATABASE_URL vào .env

## Phase 2: Infrastructure
- [x] Tạo src/types/express.d.ts (mở rộng Request type cho req.user)
- [x] Tạo src/middleware/authMiddleware.ts
- [x] Tạo src/utils/emailService.ts
- [x] Xóa src/middleware/authMiddleware.js
- [x] Xóa src/utils/emailService.js

## Phase 3: Services
- [x] Tạo src/services/interactionService.ts (dùng Prisma)
- [x] Tạo src/services/promotionService.ts (dùng prisma.$transaction)

## Phase 4: Controllers (gọi Prisma trực tiếp, BỎ tầng models/)
**Admin** (`src/controllers/admin/`):
- [x] bannerController.ts
- [x] categoryController.ts
- [x] inventoryController.ts
- [x] membershipController.ts (thêm createMembership, deleteMembership)
- [x] orderController.ts
- [x] productController.ts
- [x] promotionController.ts
- [x] saleController.ts
- [x] statsController.ts
- [x] voucherController.ts

**Client** (`src/controllers/client/`):
- [x] authController.ts (thêm logout, changePassword)
- [x] bannerController.ts
- [x] categoryController.ts
- [x] chatController.ts
- [x] membershipController.ts
- [x] orderController.ts
- [x] productController.ts
- [x] productDetailController.ts
- [x] promotionController.ts
- [x] saleController.ts
- [x] voucherController.ts

## Phase 5: Routes (đổi extension + import TS)
- [x] src/routes/admin/index.ts (fix authorizeRole → requireAdmin)
- [x] src/routes/client/index.ts

## Phase 6: Entry Point
- [x] src/index.ts (từ index.js)
- [x] package.json scripts (dev dùng `tsx watch`, start dùng `tsx`)

## Phase 7: Cleanup & Verify
- [x] Xóa src/middleware/authMiddleware.js
- [x] Xóa src/utils/emailService.js
- [x] Bỏ tầng src/models/ (không tồn tại - đã bỏ hoàn toàn)
- [x] Fix tsconfig.json (moduleResolution: node16, module: Node16)
- [x] `node node_modules/typescript/bin/tsc --noEmit` → **0 errors** ✅
- [x] Test server chạy được với `npm run dev` (cần DB đang chạy) - Đã chạy thành công tại port 5000

---

## Ghi chú quan trọng
- **Prisma v7**: dùng `@prisma/adapter-mariadb` (không phải mysql2 adapter)
- **Bỏ tầng models/**: controllers gọi `prisma.*` trực tiếp
- **DB**: MySQL localhost:3306, database: shopdb
- **Query phức tạp**: admin stats, recommendation → dùng `prisma.$queryRaw`
- **Transactions**: dùng `prisma.$transaction(async (tx) => { ... })`
- **orderController**: transaction + MoMo payment
- **promotionService**: đã chuyển sang `prisma.$transaction`, bỏ manual connection
- **tsconfig**: module=Node16, moduleResolution=node16 (bắt buộc với TypeScript 7.x)
