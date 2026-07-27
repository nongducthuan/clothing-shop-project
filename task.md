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
- [ ] Xóa src/db.js (thay bằng prisma/client.ts)

## Phase 3: Services
- [x] Tạo src/services/interactionService.ts (dùng Prisma)
- [x] Tạo src/services/promotionService.ts (dùng prisma.$transaction)

## Phase 4: Controllers (gọi Prisma trực tiếp, BỎ tầng models/)
- [ ] src/controllers/authController.ts
- [ ] src/controllers/productController.ts
- [ ] src/controllers/orderController.ts  ← phức tạp nhất (484 lines, transactions, MoMo)
- [ ] src/controllers/adminController.ts  ← nhiều raw SQL nặng (stats, joins)
- [ ] src/controllers/categoryController.ts
- [ ] src/controllers/voucherController.ts
- [ ] src/controllers/saleController.ts
- [ ] src/controllers/promotionController.ts
- [ ] src/controllers/inventoryController.ts
- [ ] src/controllers/membershipController.ts
- [ ] src/controllers/productDetailController.ts
- [ ] src/controllers/chatController.ts

## Phase 5: Routes (đổi extension + import TS)
- [ ] src/routes/adminRoute.ts
- [ ] src/routes/authRoute.ts
- [ ] src/routes/categoryRoute.ts
- [ ] src/routes/chatRoute.ts
- [ ] src/routes/inventoryRoute.ts
- [ ] src/routes/membershipRoute.ts
- [ ] src/routes/orderRoute.ts
- [ ] src/routes/productRoute.ts
- [ ] src/routes/promotionRoute.ts
- [ ] src/routes/recommendationRoute.ts
- [ ] src/routes/saleRoute.ts
- [ ] src/routes/uploadRoute.ts
- [ ] src/routes/voucherRoute.ts

## Phase 6: Entry Point
- [ ] Tạo index.ts (từ index.js)
- [ ] Cập nhật package.json scripts (dev dùng tsx, build dùng tsc)

## Phase 7: Cleanup & Verify
- [ ] Xóa toàn bộ file .js cũ (models/, controllers/, routes/, services/, middleware/, utils/, index.js, seedAdmin.js, src/db.js)
- [ ] Xóa thư mục src/models/ (bỏ hoàn toàn)
- [ ] Run `npx tsc --noEmit` kiểm tra TypeScript errors
- [ ] Test server chạy được với `npm run dev`

---

## Ghi chú quan trọng
- **Prisma v7**: dùng `@prisma/adapter-mariadb` (không phải mysql2 adapter)
- **Bỏ tầng models/**: controllers gọi `prisma.*` trực tiếp
- **DB**: MySQL localhost:3306, database: shopdb
- **Query phức tạp**: admin stats, recommendation → dùng `prisma.$queryRaw`
- **Transactions**: dùng `prisma.$transaction(async (tx) => { ... })`
- **orderController**: transaction + MoMo payment, cần chú ý khi convert
- **promotionService**: đã chuyển sang `prisma.$transaction`, bỏ manual connection
