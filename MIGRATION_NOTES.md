# MIGRATION NOTES: Tách frontend thành `admin` + `storefront` (Next.js)

## 1. Baseline Verification (Trước khi thực hiện Phase 1)
- **Thời gian thực hiện**: 2026-11-22
- **Branch**: `feat/split-frontend-p1`
- **Kết quả baseline**:
  - `typecheck`: Pass (0 lỗi)
  - `vitest run`: Pass 17/17 test files, 101/101 tests passed
  - `check:i18n`: Pass (235 files scanned, 815 keys used, 1217/1217 vi/en keys match)
  - `vite build`: Pass (dist generated)

## 2. Các điểm kỹ thuật & quyết định kiến trúc
- **adminToken**: Tìm thấy tại duy nhất `frontend/src/hooks/admin/useOrderManager.ts:40`:
  `return localStorage.getItem("token") || localStorage.getItem("adminToken");`
  -> Giữ fallback để tương thích ngược nếu admin session cũ còn tồn tại, nhưng app admin thống nhất lưu trữ vào key `token`.
- **Cấu trúc package**:
  - `frontend/shared`: Tên `@shop/shared`. Source-first exports (`./* -> ./src/*`), không build riêng.
  - `frontend/admin`: Tên `admin`. Vite SPA port 5174. URL bỏ prefix `/admin`.
  - `frontend/storefront`: Tên `storefront`. Tạm thời vẫn là Vite SPA trong Phase 1 để kiểm tra workspace và `@shop/shared`. Sẽ migrate sang Next.js App Router ở Phase 2-3.
- **Biến môi trường trong `shared`**:
  - Không truy cập `import.meta.env` trực tiếp trong `@shop/shared`.
  - Sử dụng `configureShared({ apiUrl, imageUrl, socketUrl })` và `getConfig()`.

## 3. Nhật ký các Phase & Gate Check

### Phase 1: Dựng workspace + shared, chưa đổi framework
- **Trạng thái**: Hoàn thành (PASS Gate 1)
- **Chi tiết thực hiện**:
  1. Tạo package `@shop/shared` chứa core logic: `apiClient`, `aiService`, `types`, `utils`, `locales`, `constants`, `context` (Language, Toast, Theme, Auth), `useRequiredContext`, components dùng chung (`EmptyState`, `PageLoader`, `PaymentBadge`, `NotificationDropdown`, `Toast`, `AuthAlert`, `AuthInput`).
  2. Tạo `frontend/shared/src/config.ts` (`configureShared` / `getConfig`) tách biệt hoàn toàn truy cập `import.meta.env` khỏi shared.
  3. Tạo package `admin` (Vite, port 5174), đã gỡ bỏ tiền tố `/admin` khỏi URL route (`/`, `/products`, `/orders`, `/banners`, etc.).
  4. Tạo `AdminHeader` với Notification realtime (`isAdmin={true}`), chuyển ngôn ngữ, đổi theme, và profile/đăng xuất.
  5. Tạo package `storefront` (Vite, port 5173), đã gỡ các route và layout admin, cập nhật link `/admin` thành `VITE_ADMIN_URL` ngoài navbar/mobile menu cho user admin.
  6. Viết script `check-i18n.cjs` trong `shared/scripts/` quét cả 3 package (`shared/src`, `admin/src`, `storefront/src`).
- **Gate 1 Checklist**:
  - [x] `cd frontend && npm install && npm run typecheck && npm run lint && npm test && npm run build` đều xanh:
    - `check:i18n`: 245 files quét, 815 keys dùng trong code, 1217/1217 vi/en khớp 100%.
    - `typecheck`: 3/3 packages (@shop/shared, admin, storefront) không lỗi TypeScript.
    - `lint`: 3/3 packages pass eslint không lỗi.
    - `test`: 17/17 test files passed (84 tests in shared, 17 tests in storefront, total 101/101 tests passed).
    - `build`: admin và storefront build thành công.
  - [x] `check:i18n` bắt được lỗi: Đã thử nghiệm xóa tạm `nav.home` ở locale `en` -> script chặn và báo lỗi `[thiếu "en"] nav.home` chính xác, sau đó phục hồi.
  - [x] `grep -rn "react-router-dom" shared/src` -> Rỗng 100% (shared hoàn toàn độc lập với router).
- **Commit**: `refactor(frontend): split into shared/admin/storefront workspaces`
