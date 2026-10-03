# Clothing Shop — Frontend (React + Vite + TypeScript)

Giao diện khách hàng và trang quản trị của đồ án **Clothing Shop**.

Đây là phần frontend trong monorepo. Tài liệu đầy đủ (kiến trúc, danh sách API, tài khoản test, thẻ sandbox MoMo/VNPay, hướng dẫn seed...) nằm ở **[README gốc của dự án](../README.md)**.

---

## Yêu cầu

- **Node.js 22.12+** — Vite 7 yêu cầu `^20.19.0 || >=22.12.0`, Vitest 5 yêu cầu `^22.12.0 || ^24.0.0 || >=26.0.0`; repo đã kiểm thử với Node 24.
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

**Kết quả hiện tại:** `54 tests passed` across 7 test suites (chạy `npm test` trong `frontend/`) — `shippingUtils`, `orderUtils`, `currencyUtils`, `promotionUtils`, `translations`, `apiMessagePatterns`, `apiErrorUtils`. Chi tiết từng suite xem bảng ở [README gốc của dự án](../README.md#2-frontend-testing-vitest).

- Cấu hình ở `vitest.config.ts`: `environment: 'node'`, include `src/**/*.test.ts(x)`; test được đặt cạnh file nguồn trong `src/`.
- `locales/translations.test.ts` chốt 2 lỗi đã từng gặp: chuỗi tiếng Việt bị double-encode (mojibake) và key `vi`/`en` lệch nhau. Nếu file bị mojibake, dùng `scripts/fix-mojibake.cjs` để sửa rồi mở lại file bằng editor UTF-8.

## Đa ngôn ngữ (i18n)

- Toàn bộ chuỗi nằm ở `src/locales/translations.ts` với 2 locale `vi` / `en`, dùng qua `t("key", "mặc định")`.
- `scripts/check-i18n.cjs` (chạy trước `vite build`) sẽ **chặn build** khi: key chỉ có ở 1 locale, key trùng lặp, placeholder `{...}` lệch nhau giữa vi/en, hoặc code gọi `t("...")` mà key chưa được khai báo ở cả 2 locale.

## Ghi chú cấu trúc

- Alias `@` → `src/` (khai báo trong `vite.config.ts`).
- SPA rewrite mọi route về `/` trong `vercel.json` → deploy Vercel chạy đúng khi refresh ở route con.
- Các nhánh chính trong `src/`: `pages/` (customer 10 / admin 11 / auth 2 + `NotFound`), `components/` (admin/auth/common/customer 13 nhóm), `hooks/` (23: admin 11 / customer 9 / auth 2 + `useAutoCancelCountdown` shared), `context/` (6 cặp Context + Provider), `services/` (`apiClient` + `aiService`), `utils/` (8 helper + 5 file `*.test.ts`), `locales/` (`translations.ts` + `apiMessagePatterns.ts` + 2 file `*.test.ts`), `types/`.
