# Clothing Shop — Frontend (React + Vite + TypeScript)

Giao diện khách hàng và trang quản trị của đồ án **Clothing Shop**.

Đây là phần frontend trong monorepo. Tài liệu đầy đủ (kiến trúc, danh sách API, tài khoản test, thẻ sandbox MoMo/VNPay, hướng dẫn seed...) nằm ở **[README gốc của dự án](../README.md)**.

---

## Yêu cầu

- **Node.js tương thích với Vitest 5**: dùng một trong các dải `^22.12.0`, `^24.0.0` hoặc `>=26.0.0`. Vite 7 riêng lẻ còn hỗ trợ `^20.19.0`, nhưng dải này không đáp ứng yêu cầu engine của Vitest 5. Repository đã được kiểm thử với Node 24.
- Backend phải đang chạy (mặc định `http://localhost:5000`) để gọi API.

## Cài đặt & chạy

```bash
npm install
cp .env.example .env      # Windows CMD/PowerShell: copy .env.example .env
npm run dev               # http://localhost:5173
```

### Biến môi trường (`frontend/.env`)

| Tên biến | Mô tả | Mẫu |
| --- | --- | --- |
| `VITE_API_URL` | URL gốc của API backend (Axios `apiClient`) | `http://localhost:5000/api` |
| `VITE_IMAGE_URL` | URL gốc phục vụ ảnh (`/public`, `/uploads`) | `http://localhost:5000` |

> Vite nhúng biến `VITE_*` vào bundle **lúc build**, nên khi đổi domain backend phải cập nhật 2 biến này rồi build lại. Nhớ thêm domain frontend vào `FRONTEND_URL` của backend (CORS) — mặc định backend chỉ cho phép `http://localhost:5173`.

## Scripts

| Lệnh | Việc |
| --- | --- |
| `npm run dev` | Dev server Vite kèm HMR (cổng mặc định 5173) |
| `npm run build` | Chạy `check:i18n` rồi build production ra `dist/` |
| `npm run preview` | Chạy thử bundle production |
| `npm run lint` | ESLint |
| `npm run test` | Unit test bằng Vitest (`vitest run`) |
| `npm run check:i18n` | Kiểm tra bản dịch vi/en (được gọi tự động trước `build`) |

## Kiểm thử

```bash
npm test
```

**Theo các test case được liệt kê trong source:** `99 test cases` across 16 test suites — `shippingUtils`, `orderUtils`, `currencyUtils`, `promotionUtils`, `translations`, `apiMessagePatterns`, `apiErrorUtils`, `returnRequestUtils`, `useOrderActions`, `checkoutPricing`, `CartProvider`, `priceUtils`, `productSearchUtils`, `useCategoryPage`, `useProductDetail`, `useCartPage`. Chi tiết xem [bảng test trong README gốc](../README.md#2-frontend-testing-vitest).

- Cấu hình ở `vitest.config.ts`: `environment: 'node'`, include `src/**/*.test.ts(x)`; test được đặt cạnh file nguồn trong `src/`. Riêng 5 file (`CartProvider.test.tsx` và 4 test hook trong `hooks/customer/`) bật `jsdom` bằng dòng `// @vitest-environment jsdom` vì cần `localStorage`/React Testing Library.
- `locales/translations.test.ts` chốt 2 lỗi đã từng gặp: chuỗi tiếng Việt bị double-encode (mojibake) và key `vi`/`en` lệch nhau.
- `context/CartProvider.test.tsx` chạy trong `jsdom` để kiểm tra tồn kho bằng 0, giới hạn số lượng, và phục hồi khi dữ liệu giỏ hàng trong `localStorage` bị lỗi.
- Nút **Đổi trả** chỉ hiển thị khi backend trả `can_return !== false` (quy tắc 7 ngày tính ở backend, frontend không tự tính lại); lỗi quá hạn từ API được dịch qua key `api_msg.Return period has expired...`.
- `hooks/customer/useOrderActions.test.tsx` kiểm tra các action nghiệp vụ của hook đơn hàng cho cả guest và user đăng nhập. `useCategoryPage.test.tsx` kiểm tra reset phân trang khi đổi danh mục; `useProductDetail.test.tsx` kiểm tra không giữ ưu đãi của sản phẩm trước; `useCartPage.test.tsx` kiểm tra ưu tiên khuyến mãi và tồn kho quà dùng chung.
- `utils/returnRequestUtils.test.ts` kiểm tra helper phục vụ luồng đổi trả và optimistic UI. Nếu file bị mojibake, dùng `scripts/fix-mojibake.cjs` để sửa rồi mở lại file bằng editor UTF-8.

## Đa ngôn ngữ (i18n)

- Toàn bộ chuỗi nằm ở `src/locales/translations.ts` với 2 locale `vi` / `en`, dùng qua `t("key", "mặc định")`.
- `scripts/check-i18n.cjs` (chạy trước `vite build`) sẽ **chặn build** khi: key chỉ có ở 1 locale, key trùng lặp, placeholder `{...}` lệch nhau giữa vi/en, hoặc code gọi `t("...")` mà key chưa được khai báo ở cả 2 locale.

## Ghi chú cấu trúc

- Alias `@` → `src/` (khai báo trong `vite.config.ts`).
- SPA rewrite mọi route về `/` trong `vercel.json` → deploy Vercel chạy đúng khi refresh ở route con.
- Các nhánh chính trong `src/`: `pages/` (customer 10 / admin 11 / auth 2 + `NotFound`), `components/` (117 files: admin 39 / auth 3 / common 4 / customer 71), `hooks/` (admin 12 + `product/` 5 + `user/` 5 / customer 16 (bao gồm profileTypes.ts) / auth 2 + 2 hook dùng chung; có 4 test hook), `context/` (6 cặp Context + Provider + `CartProvider.test.tsx`), `services/` (`apiClient.ts` + `aiService.ts`, chưa có test file trong thư mục này), `utils/` (12 helper + 9 file `*.test.ts`, gồm `priceUtils` và `productSearchUtils`), `locales/` (`translations.ts` + `apiMessagePatterns.ts` + 2 file `*.test.ts`), `constants/` (`tierConfig.ts`), `types/` (`index.ts` + `aos.d.ts`).