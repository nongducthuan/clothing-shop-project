# Clothing Shop — Frontend Workspace

Frontend của đồ án **Clothing Shop** được tổ chức dưới dạng **npm workspace monorepo** gồm 3 packages:
- **`shared` (`@shop/shared`)**: Thư viện dùng chung core types, contexts (Auth, Language, Theme, Toast), API client, i18n locales và tiện ích.
- **`storefront`**: Giao diện khách hàng xây dựng trên **Next.js 16.4.6 (App Router, Turbopack, React 19.1, TailwindCSS 4)** chạy tại cổng `5173`.
- **`admin`**: Bảng điều khiển quản trị xây dựng trên **Vite 7 (React 19.1, React Router 7, React Google Charts, TailwindCSS 4)** chạy tại cổng `5174`.

Tài liệu toàn diện về toàn bộ hệ thống (kiến trúc, backend, API endpoints, tài khoản test, thẻ sandbox MoMo/VNPay...) xem tại **[README gốc của dự án](../README.md)**.

---

## Cấu Trúc Monorepo

```text
frontend/
├── shared/                         # Package @shop/shared
│   ├── src/
│   │   ├── context/                # Auth, Theme, Language, Toast contexts
│   │   ├── locales/                # translations.ts (vi/en), apiMessagePatterns.ts
│   │   ├── services/               # apiClient (Axios instance), token storage
│   │   ├── types/                  # Shared data types, API responses, status enums
│   │   └── utils/                  # Price, shipping, order, return, currency, search helpers
│   ├── scripts/                    # check-i18n.cjs
│   └── package.json
├── admin/                          # Package admin (Vite 7 SPA · Port 5174)
│   ├── src/
│   │   ├── components/             # Admin layout, sidebar, tables, modals, charts
│   │   ├── hooks/                  # Admin data management hooks
│   │   ├── pages/                  # Dashboard, Products, Categories, Orders, Reports, Users...
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
├── storefront/                     # Package storefront (Next.js 16 App Router · Port 5173)
│   ├── src/
│   │   ├── app/                    # App Router routes: layout, page, cart, checkout, profile...
│   │   ├── components/             # UI components: cart, category, chatbot, checkout, home, layout...
│   │   └── hooks/                  # Storefront hooks & types
│   ├── next.config.ts
│   └── package.json
└── package.json                    # Root npm workspace
```

---

## Yêu Cầu Môi Trường

- **Node.js**: Phiên bản tương thích với Vitest 5 (`^22.12.0`, `^24.0.0` hoặc `>=26.0.0`). Dự án khuyến nghị Node.js 22 LTS hoặc Node.js 24.
- **Backend API**: Backend NestJS phải đang chạy (mặc định tại `http://localhost:5000/api`) để xử lý dữ liệu và thanh toán.

---

## Cài Đặt & Khởi Động

### 1. Cài đặt dependencies (tại thư mục `frontend`)

```bash
cd frontend
npm install
```

### 2. Cấu hình biến môi trường

Tạo file `.env` cho từng ứng dụng từ file mẫu `.env.example`:

```bash
cp storefront/.env.example storefront/.env
cp admin/.env.example admin/.env
```

#### Biến môi trường Storefront (`frontend/storefront/.env`)

| Biến | Mô tả | Mẫu giá trị |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | URL gốc của Backend REST API | `http://localhost:5000/api` |
| `NEXT_PUBLIC_IMAGE_URL` | URL gốc phục vụ file ảnh tĩnh từ Backend | `http://localhost:5000` |
| `NEXT_PUBLIC_ADMIN_URL` | URL trang Admin (dùng cho link chuyển trang quản trị) | `http://localhost:5174` |

#### Biến môi trường Admin (`frontend/admin/.env`)

| Biến | Mô tả | Mẫu giá trị |
| --- | --- | --- |
| `VITE_API_URL` | URL gốc của Backend REST API | `http://localhost:5000/api` |
| `VITE_IMAGE_URL` | URL gốc phục vụ file ảnh tĩnh từ Backend | `http://localhost:5000` |

### 3. Chạy môi trường phát triển (Development)

Chạy từ thư mục `frontend`:

```bash
# Chạy Storefront (Next.js 16 tại http://localhost:5173)
npm run dev:storefront
# hoặc
npm run dev

# Chạy Admin (Vite SPA tại http://localhost:5174)
npm run dev:admin
```

---

## Các Lệnh Scripts Chính

| Lệnh | Ý nghĩa |
| --- | --- |
| `npm run dev` | Khởi động dev server Storefront (Next.js 16 trên port 5173) |
| `npm run dev:storefront` | Khởi động dev server Storefront (Next.js 16 trên port 5173) |
| `npm run dev:admin` | Khởi động dev server Admin (Vite 7 trên port 5174) |
| `npm run build` | Build production cho tất cả packages trong workspace |
| `npm run typecheck` | Kiểm tra TypeScript (`tsc --noEmit`) toàn bộ packages |
| `npm run lint` | Chạy linter ESLint cho toàn bộ workspace |
| `npm run test` | Chạy bộ kiểm thử unit test Vitest cho toàn bộ workspace |
| `npm run check:i18n` | Rà soát tính toàn vẹn và đồng bộ chuỗi dịch song ngữ `vi`/`en` |

---

## Kiểm Thử (Testing)

Frontend sở hữu **17 test suites (101 tests)** chạy với Vitest:

```bash
cd frontend
npm test
```

### Phân Bổ Test Suites

1. **Package `@shop/shared` (11 test suites · 84 tests)**:
   - `currencyUtils.test.ts`: Định dạng tiền tệ VND / USD, tỷ giá hiển thị.
   - `translations.test.ts`: Rà soát chống lỗi double-encode (mojibake) và lệch key giữa 2 locale `vi` / `en`.
   - `productSearchUtils.test.ts`: Tìm kiếm, chuẩn hóa ký tự tiếng Việt có dấu/không dấu, lọc đa trường.
   - `priceUtils.test.ts`: Tính toán giá trị giảm, tỷ lệ chiết khấu, giá hiển thị.
   - `checkoutPricing.test.ts`: Kiểm tra logic phân bổ voucher và tổng tiền thanh toán.
   - `promotionUtils.test.ts`: Quy tắc khuyến mãi Buy X Get Y, kiểm tra điều kiện tặng quà.
   - `shippingUtils.test.ts`: Tính phí ship theo khu vực, ngưỡng miễn phí vận chuyển.
   - `apiMessagePatterns.test.ts`: Khớp nối mã phản hồi API và thông điệp người dùng.
   - `orderUtils.test.ts`: Xử lý trạng thái đơn hàng, trạng thái thanh toán, quyền đổi trả.
   - `apiErrorUtils.test.ts`: Bóc tách thông điệp lỗi HTTP từ Axios/NestJS.
   - `returnRequestUtils.test.ts`: Helper cho luồng đổi trả và cập nhật optimistic UI.

2. **Package `storefront` (6 test suites · 17 tests)**:
   - `src/hooks/useOrderActions.test.tsx`: Hành động đơn hàng (hủy đơn, nhận hàng, thanh toán lại) cho cả khách vãng lai và thành viên.
   - `src/context/CartProvider.test.tsx`: Giỏ hàng, kiểm soát tồn kho, giới hạn số lượng và phục hồi an toàn từ `localStorage`.
   - `src/components/chatbot/__tests__/AIMessage.test.tsx`: Hiển thị link gợi ý sản phẩm thân thiện trong tin nhắn AI.
   - `src/hooks/useCartPage.test.tsx`: Tương tác giỏ hàng, ưu tiên khuyến mãi, kiểm tra quà tặng.
   - `src/hooks/useCategoryPage.test.tsx`: Chuyển đổi danh mục, reset phân trang tự động.
   - `src/hooks/useProductDetail.test.tsx`: Xử lý biến thể kích thước/màu sắc, tránh giữ ưu đãi cũ khi đổi sản phẩm.

3. **Package `admin`**: Cấu hình Vitest `--passWithNoTests`.

---

## Đa Ngôn Ngữ (i18n)

- Dữ liệu dịch được quản lý tập trung tại `shared/src/locales/translations.ts` với 2 ngôn ngữ: Tiếng Việt (`vi`) và Tiếng Anh (`en`), truy xuất qua hàm `t("key", "mặc định")`.
- Script `npm run check:i18n` tự động kiểm tra trước khi build:
  - Chặn build nếu thiếu key ở một trong hai ngôn ngữ.
  - Phát hiện các placeholder `{...}` không đồng bộ giữa `vi` và `en`.
  - Báo lỗi nếu trong code xuất hiện lệnh `t("...")` gọi key chưa được khai báo.
