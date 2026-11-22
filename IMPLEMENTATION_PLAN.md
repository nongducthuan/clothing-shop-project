# IMPLEMENTATION PLAN: Tách frontend thành `admin` + `storefront` (Next.js)

> Tài liệu này dành cho agent (Antigravity) thực thi. Làm **tuần tự theo Phase**, mỗi Phase phải qua **Gate (kiểm tra)** trước khi sang Phase tiếp. Không gộp phase. Commit sau mỗi Phase.

> **Cập nhật:** thư mục/file/class `customer` đã được đổi thành `storefront` ở cả frontend (`components|hooks|pages/storefront`) và backend (`src/storefront`, `Storefront*Service`, `StorefrontModule`, `StorefrontController`). Plan bên dưới dùng tên mới. Role `customer` trong DB (`UserRole.customer`) **giữ nguyên**.

---

## 0. Bối cảnh & ràng buộc

**Repo hiện tại**

```
/
├── backend/            # NestJS + Prisma (KHÔNG sửa logic, chỉ chỉnh CORS/env nếu cần)
├── frontend/           # Vite + React 19 + react-router-dom v7 + Tailwind 3 (SPA)
└── .github/workflows/ci.yml
```

**Mục tiêu cuối**

```
frontend/
├── shared/       # package dùng chung (apiClient, types, utils, i18n, contexts lõi)
├── admin/        # Vite SPA (GIỮ Vite + react-router), chỉ chứa phần admin + login
└── storefront/   # Next.js App Router (phần storefront + auth)
```

**Quy tắc bất biến**

1. Không đổi hành vi nghiệp vụ, không đổi API contract với backend.
2. Không đổi nội dung `translations.ts` (chỉ di chuyển).
3. Mọi test hiện có (`*.test.ts(x)`) phải tiếp tục pass sau khi di chuyển.
4. Không dùng `any` mới; giữ `strict: true`.
5. Mỗi Phase kết thúc bằng: `typecheck`, `lint`, `test`, `build` xanh cho các package đã tồn tại.
6. Giữ Tailwind **v3.4** (không nâng v4).

**Số liệu đã khảo sát (để biết khối lượng)**

- 32 file import `react-router-dom`: `Link`(43), `useNavigate`(42), `useSearchParams`(8), `useParams`(6), `useLocation`(6), `NavLink`(6), `Outlet`(3), `Navigate`(2).
- `import.meta.env` dùng: `VITE_API_URL`, `VITE_IMAGE_URL` (~8 chỗ: `services/apiClient.ts`, `utils/imageUtils.ts`, `components/storefront/home/homeData.ts`, `components/admin/layout/AdminLayout.tsx`, `components/common/NotificationDropdown.tsx`, `pages/admin/Dashboard.tsx`, `hooks/admin/useProductDetailManager.ts`, `hooks/admin/product/productApi.ts`).
- `localStorage` keys: `token`, `user`, `refreshToken`, `clothing-cart`, `language`, `theme`, và `adminToken` (1 chỗ, cần kiểm tra có còn dùng không). `sessionStorage`: `guestOrderAccessToken`.
- Admin và storefront **không import chéo nhau** (đã xác minh), chỉ dùng chung phần lõi.
- `aos` dùng ở `RecommendedProducts.tsx` và `hooks/storefront/useHomePage.ts` (+ `types/aos.d.ts`).
- `scripts/check-i18n.cjs` parse `src/locales/translations.ts` và quét `t("...")` trong `src/` → cần chỉnh đường dẫn khi di chuyển.
- `vercel.json` đang rewrite mọi route về `/` (kiểu SPA).
- Backend CORS: `FRONTEND_URL` (danh sách phân tách), đã cho phép localhost, `*.vercel.app`, `*.onrender.com`.

---

## Phase 1: Dựng workspace + `shared`, chưa đổi framework

**Mục tiêu:** tách thư mục, mọi thứ vẫn là Vite, build/test xanh.

### 1.1 Root workspace

Tạo `frontend/package.json` (root workspace, `private: true`):

```json
{
  "name": "clothing-shop-frontend",
  "private": true,
  "workspaces": ["shared", "admin", "storefront"],
  "scripts": {
    "dev:admin": "npm run dev -w admin",
    "dev:storefront": "npm run dev -w storefront",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "build": "npm run build --workspaces --if-present",
    "check:i18n": "npm run check:i18n -w shared"
  }
}
```

> Lưu ý: file `frontend/package.json` hiện có (name `client`) sẽ được **chuyển vào `storefront/`** ở bước 1.3 rồi chỉnh. Đừng ghi đè trước khi chuyển.

### 1.2 Package `frontend/shared`

Tên package: `@shop/shared`. Dùng **source-first** (không build riêng): `main`/`exports` trỏ thẳng vào `src/*.ts(x)`, để Vite và Next (`transpilePackages`) tự biên dịch.

Di chuyển từ `frontend/src/` sang `frontend/shared/src/`:

| Từ | Sang |
|---|---|
| `services/apiClient.ts`, `services/aiService.ts` | `shared/src/services/` |
| `types/` (trừ `aos.d.ts`, `vite-env.d.ts`) | `shared/src/types/` |
| `utils/*` (kèm `*.test.ts`) | `shared/src/utils/` |
| `locales/*` (kèm test) | `shared/src/locales/` |
| `constants/tierConfig.ts` | `shared/src/constants/` |
| `context/LanguageContext.tsx`, `LanguageProvider.tsx`, `ToastContext.tsx`, `ToastProvider.tsx`, `ThemeContext.tsx`, `ThemeProvider.tsx`, `AuthContext.tsx`, `AuthProvider.tsx` | `shared/src/context/` |
| `hooks/useRequiredContext.ts` | `shared/src/hooks/` |
| `components/common/*` (`EmptyState`, `PageLoader`, `PaymentBadge`, `NotificationDropdown`) | `shared/src/components/common/` |
| `scripts/check-i18n.cjs` | `shared/scripts/` |

**Không** chuyển vào shared (là của storefront): `CartContext/CartProvider`, `AIChatContext/AIChatProvider`, `SEO.tsx`, `useAutoCancelCountdown.ts` (kiểm tra: nếu admin không dùng thì để storefront).

`shared/package.json`:

```json
{
  "name": "@shop/shared",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": {
    "./*": "./src/*"
  },
  "scripts": {
    "check:i18n": "node scripts/check-i18n.cjs",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": { "react": "^19", "react-dom": "^19" },
  "dependencies": { "axios": "^1.11.0", "socket.io-client": "^4.8.3", "lucide-react": "^0.563.0" }
}
```

Ghi chú quan trọng:

- `apiClient.ts` và `NotificationDropdown.tsx` đang dùng `import.meta.env.VITE_*`. Trong `shared` **không đọc env trực tiếp**. Tạo `shared/src/config.ts`:

  ```ts
  export interface SharedConfig { apiUrl: string; imageUrl: string; socketUrl: string }
  let cfg: SharedConfig | null = null;
  export const configureShared = (c: SharedConfig) => { cfg = c; };
  export const getConfig = (): SharedConfig => {
    if (!cfg) throw new Error("configureShared() chưa được gọi");
    return cfg;
  };
  ```

  Mỗi app gọi `configureShared({...})` **một lần ở entry** (Vite: `main.tsx`; Next: module `lib/shared-config.ts` được import ở `providers.tsx`). `apiClient` đọc `getConfig().apiUrl` **lazy** (trong interceptor/`baseURL` set khi gọi `configureShared`), `imageUtils` đọc `getConfig().imageUrl`.
- `shared/tsconfig.json`: `strict`, `jsx: react-jsx`, `moduleResolution: bundler`, paths `@shop/shared/*`.
- Sửa `scripts/check-i18n.cjs`: `FRONTEND_DIR` giờ phải quét **cả 3 package** (`shared/src`, `admin/src`, `storefront/src` hoặc `storefront/**`) để bắt `t("...")` dùng trong code, còn `TRANSLATIONS_FILE` trỏ `shared/src/locales/translations.ts`.

### 1.3 Package `frontend/admin` (Vite)

- Tạo `admin/` từ cấu hình Vite hiện tại (copy `index.html`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `vitest.config.ts`).
- Chuyển vào `admin/src/`:
  - `components/admin/**`, `hooks/admin/**`, `pages/admin/**`
  - `components/auth/ProtectedRoute.tsx`
  - `pages/auth/Login.tsx`, `hooks/auth/useLogin.ts`, `components/auth/AuthAlert.tsx`, `AuthInput.tsx` (**copy**; nếu storefront cũng cần thì để bản gốc ở `shared` rồi import — ưu tiên đưa `AuthAlert/AuthInput` vào `shared/src/components/auth/`)
  - `pages/NotFound.tsx` (copy)
  - `styles/` (copy `index.css`, `app.css`)
- Tạo `admin/src/App.tsx` mới: **chỉ** các route admin, bọc `HelmetProvider`? (không cần, bỏ), `QueryClientProvider`, `ThemeProvider`, `LanguageProvider`, `ToastProvider`, `AuthProvider`, `BrowserRouter`. Route:
  - `/login` → `Login`
  - `/` (layout `ProtectedRoute roleRequired="admin"` + `AdminLayout`) với các con: index=Dashboard, `banners`, `products`, `products/:id`, `orders`, `categories`, `report`, `vouchers`, `sales`, `promotions`, `users`
  - `*` → `NotFound`
  - **Bỏ tiền tố `/admin`** khỏi URL (admin giờ có domain riêng). Phải sửa mọi `navigate("/admin/...")`, `<Link to="/admin/...">`, `NavLink` trong `AdminSidebar.tsx`, `AdminLayout.tsx`, và các hook admin. Dùng `grep -rn '"/admin' admin/src` để rà.
  - `useLogin.ts`: sau đăng nhập, nếu `role !== "admin"` → hiển thị lỗi "không có quyền" và xóa session (không điều hướng sang storefront).
- `admin/package.json` (name `admin`): dependencies: `@shop/shared`, `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `react-google-charts`, `axios`, `lucide-react`, `socket.io-client`; devDependencies lấy từ file cũ.
- `admin/vite.config.ts`: giữ alias `@` → `./src`; thêm `server.port: 5174`.
- `admin/.env.example`: `VITE_API_URL=http://localhost:5000/api`, `VITE_IMAGE_URL=http://localhost:5000`.
- `admin/src/main.tsx`: gọi `configureShared({ apiUrl: import.meta.env.VITE_API_URL, imageUrl: import.meta.env.VITE_IMAGE_URL, socketUrl: apiUrl.replace(/\/api$/, "") })` **trước** khi render.
- `admin/vercel.json`: giữ rewrite SPA.
- Footer/Navbar customer **không** có trong admin.

### 1.4 Package `frontend/storefront` (tạm thời vẫn Vite)

- Chuyển phần còn lại của `frontend/` cũ vào `storefront/`: `components/storefront/**`, `hooks/storefront/**`, `pages/storefront/**`, `pages/auth/Register.tsx`, `Login.tsx` (bản customer), `components/common/SEO.tsx`, `context/Cart*`, `context/AIChat*`, `hooks/useAutoCancelCountdown.ts`, `public/`, `styles/`, `App.tsx` (bỏ toàn bộ route admin và `AdminLayout`).
- Bỏ link `/admin` trong `UserDropdown.tsx`, `MobileMenu.tsx`; thay bằng link tuyệt đối `import.meta.env.VITE_ADMIN_URL` (ẩn nếu biến rỗng) — chỉ hiện cho user role admin.
- `Footer.tsx`: xóa điều kiện `pathname.startsWith("/admin")`.
- Cập nhật tất cả import cũ sang `@shop/shared/...`. Dùng codemod/sed có kiểm soát, ví dụ `../../context/LanguageContext` → `@shop/shared/context/LanguageContext`.
- `storefront/package.json` (name `storefront`): bỏ `react-google-charts`.

### 1.5 Dọn root & CI

- Xóa `frontend/src`, `frontend/package.json` cũ, `frontend/package-lock.json` cũ; chạy `npm install` ở `frontend/` để sinh lockfile workspace.
- Cập nhật `.github/workflows/ci.yml` job `test-frontend`:
  - `cache-dependency-path: frontend/package-lock.json`
  - `npm ci` ở `./frontend`
  - Chạy lần lượt: `npm run check:i18n`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` (tất cả ở `./frontend`, các script đã fan-out qua workspaces).

### Gate 1

- [ ] `cd frontend && npm install && npm run typecheck && npm run lint && npm test && npm run build` đều xanh.
- [ ] `check:i18n` xanh và vẫn bắt được lỗi (thử xóa tạm 1 key `en`, phải fail, rồi hoàn lại).
- [ ] `npm run dev:admin` (5174) đăng nhập admin được, mọi trang quản trị hoạt động, socket thông báo hoạt động.
- [ ] `npm run dev:storefront` (5173) chạy như cũ (trang chủ, cart, checkout, profile).
- [ ] `grep -rn "react-router-dom" shared/src` → rỗng (shared không phụ thuộc router; nếu có component dùng `Link`/`useNavigate` trong shared như `NotificationDropdown`, thay bằng prop `onNavigate`/`renderLink` hoặc callback do app truyền vào).
- [ ] Commit: `refactor(frontend): split into shared/admin/storefront workspaces`.

---

## Phase 2: Dựng khung Next.js trong `storefront`

**Mục tiêu:** Next chạy song song, chưa chuyển trang. Làm trên nhánh riêng; không xóa code Vite cho tới Phase 4.

### 2.1 Khởi tạo

- Next.js **15.x** (App Router, TypeScript, **không** dùng `src/` trùng với thư mục hiện tại: dùng `storefront/src/app/`). React 19.
- Cấu hình `next.config.ts`:

  ```ts
  import type { NextConfig } from "next";
  const config: NextConfig = {
    transpilePackages: ["@shop/shared"],
    images: { remotePatterns: [/* host của VITE_IMAGE_URL / Cloudinary / backend */] },
  };
  export default config;
  ```

- Giữ Tailwind 3: `tailwind.config.js` `content` phải gồm `./src/**/*.{ts,tsx}` **và** `../shared/src/**/*.{ts,tsx}`.
- Giữ alias `@/*` → `./src/*` trong `tsconfig.json`; bật `"jsx": "preserve"`, `plugins: [{ name: "next" }]`.
- Env: đổi `VITE_*` → `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_IMAGE_URL`, `NEXT_PUBLIC_ADMIN_URL`. Tạo `.env.example`.
- Scripts: `dev` (port 5173 nếu muốn giữ), `build`, `start`, `lint`, `typecheck`, `test`, `check:i18n` (gọi shared).

### 2.2 Providers & layout

- `src/app/layout.tsx` (server): `<html lang="vi">`, font, `globals.css` (nội dung từ `styles/index.css`), render `<Providers>`.
- `src/app/providers.tsx` (`"use client"`): thứ tự giữ nguyên với `App.tsx` cũ: `QueryClientProvider` → `ThemeProvider` → `LanguageProvider` → `ToastProvider` → `AuthProvider` → `CartProvider` → `AIChatProvider`; bên trong là `Navbar`, `<main className="pt-16 flex-1 flex flex-col">{children}</main>`, `Footer`, `AIChatBubble`.
- `QueryClient` tạo bằng `useState(() => new QueryClient(...))` (không tạo ở module scope).
- Gọi `configureShared({...process.env.NEXT_PUBLIC_*})` trong `src/lib/shared-config.ts`, import ở đầu `providers.tsx`.
- Theme chống nháy (FOUC): chèn script inline nhỏ trong `<head>` đọc `localStorage.theme` và đặt class `dark` trước hydrate; `<html suppressHydrationWarning>`.

### 2.3 Lớp tương thích router (quan trọng, giảm sửa hàng loạt)

Tạo `storefront/src/lib/router.tsx` (`"use client"`) export API gần giống react-router để thay import mà ít đổi logic:

| react-router | Next (wrapper) |
|---|---|
| `Link` (`to`) | `next/link` (`href`): wrapper `Link` nhận prop `to` |
| `useNavigate()` | wrapper trả hàm `navigate(to, { replace })` dùng `useRouter().push/replace` (hỗ trợ `navigate(-1)` → `router.back()`) |
| `useParams()` | `useParams()` của `next/navigation` |
| `useLocation()` | `{ pathname: usePathname(), search: "?"+searchParams }` |
| `useSearchParams()` | wrapper trả `[URLSearchParams, setSearchParams]` (set bằng `router.replace`) |
| `NavLink` | wrapper tính `isActive` từ `usePathname()` |
| `Navigate` | component gọi `router.replace` trong `useEffect` |

Sau đó thay đồng loạt `from "react-router-dom"` → `from "@/lib/router"` trong storefront. **Mọi file dùng `useSearchParams` phải nằm dưới `<Suspense>`** (yêu cầu của Next khi build static).

> Lớp wrapper là bước chuyển tiếp. Ở Phase 4 có thể thay dần bằng API Next gốc.

### Gate 2

- [ ] `npm run dev -w storefront` (Next) hiển thị trang mẫu `/` đơn giản (có Navbar/Footer) không lỗi hydration trong console.
- [ ] `npm run build -w storefront` xanh với app/ chỉ có 1 page.
- [ ] Commit: `feat(storefront): bootstrap Next.js app shell`.

---

## Phase 3: Chuyển từng route sang `app/`

Với mỗi route: tạo `page.tsx`, đưa component hiện có vào, thêm `"use client"` ở file client cần hooks/state. Chuyển theo thứ tự dưới (dễ → khó), **mỗi route là 1 commit**, chạy tay trang đó sau khi chuyển.

| # | URL cũ | File Next | Ghi chú |
|---|---|---|---|
| 1 | `*` NotFound | `app/not-found.tsx` | |
| 2 | `/sales-policy` | `app/sales-policy/page.tsx` | tĩnh, có thể là server component + `metadata` |
| 3 | `/login`, `/register` | `app/login/page.tsx`, `app/register/page.tsx` | client; redirect nếu đã đăng nhập |
| 4 | `/` Home | `app/page.tsx` | xem 3.1 (AOS, SEO) |
| 5 | `/category/:id` | `app/category/[id]/page.tsx` | `generateMetadata` |
| 6 | `/products/:id` | `app/products/[id]/page.tsx` | `generateMetadata` (title/description/og:image theo sản phẩm) |
| 7 | `/search` | `app/search/page.tsx` | bọc `Suspense` |
| 8 | `/cart` | `app/cart/page.tsx` | client |
| 9 | `/checkout` | `app/checkout/page.tsx` | client |
| 10 | `/payment-return` | `app/payment-return/page.tsx` | bọc `Suspense` (đọc query VNPay/MoMo) |
| 11 | `/order` (OrderLookup) | `app/order/page.tsx` | client; `sessionStorage` guest token |
| 12 | `/profile` | `app/profile/page.tsx` | bọc bằng guard client |

> Giữ nguyên URL công khai (đặc biệt `/payment-return`, vì đã cấu hình ở cổng MoMo/VNPay và biến môi trường backend).

### 3.1 Các điểm cần xử lý chung

**a) `localStorage`/`sessionStorage` và hydration.** Không đọc storage trong render/initializer của `useState` ở component được SSR. Quy tắc:

- State khởi tạo bằng giá trị mặc định cố định (user = null, cart = [], language = "vi", theme theo script chống FOUC).
- Đọc storage trong `useEffect` rồi `setState`, kèm cờ `hydrated`/`isReady`.
- Rà các file: `AuthProvider`, `CartProvider` (key `clothing-cart`), `LanguageProvider` (`language`), `ThemeProvider` (`theme`), `apiClient.ts` (đã chạy trong interceptor lúc request → an toàn nhưng phải guard `typeof window !== "undefined"` nếu có request chạy phía server), `ProtectedRoute`, các hook `useCheckoutPage`, `useProfileSettings`, `useProfileOrders`, `useReturnRequestForm`, `useCartPage`, `useHomePage`, `useProductDetail`.
- Test của `CartProvider` có thể cần chỉnh theo cách khởi tạo mới.

**b) `ProtectedRoute` (storefront).** Chuyển thành guard client: khi chưa `hydrated` render `PageLoader`; khi không có token → `router.replace("/login")`. Với storefront chỉ cần bảo vệ `/profile`; không còn `roleRequired="admin"`.

**c) AOS.** `import "aos/dist/aos.css"` trong `layout.tsx`; gọi `AOS.init()` trong một client component (`<AosInit />`) ở `providers.tsx`; `AOS.refresh()` giữ nguyên trong các component client.

**d) SEO.** Xóa `react-helmet-async` và `SEO.tsx`. Mỗi page dùng `export const metadata` hoặc `generateMetadata`. Với `products/[id]` và `category/[id]`: fetch server-side bằng `fetch(NEXT_PUBLIC_API_URL + ...)` (`revalidate: 300`) chỉ cho phần metadata; phần giao diện vẫn có thể là client component dùng hook hiện tại ở Phase này.

**e) Dynamic imports/lazy.** Thay `React.lazy` bằng routing tự nhiên của Next; các component nặng chỉ dùng `next/dynamic` khi cần.

**f) `socket.io-client`.** Chỉ khởi tạo trong `useEffect` (client). Đảm bảo cleanup.

**g) Ảnh.** Có thể giữ thẻ `<img>` ở giai đoạn này (tránh đổi layout). Việc chuyển sang `next/image` để làm ở Phase 4 nếu muốn.

**h) i18n.** Giữ `LanguageProvider` client-side như hiện tại (không đổi sang routing theo locale). Lưu ý `lang` của `<html>` luôn `vi` từ server, cập nhật `document.documentElement.lang` khi đổi ngôn ngữ.

### Gate 3

- [ ] Duyệt tay đủ 12 route ở cả Light/Dark, vi/en, desktop/mobile: không có lỗi hydration, không lỗi console.
- [ ] Luồng nghiệp vụ chính chạy end-to-end với backend thật: đăng ký → đăng nhập → thêm giỏ → checkout COD → xem profile → tra cứu đơn OTP (guest) → yêu cầu đổi trả; thanh toán MoMo/VNPay sandbox quay về `/payment-return` đúng.
- [ ] Refresh token tự động hoạt động (xóa `token`, giữ `refreshToken`, gọi API → phiên được làm mới).
- [ ] `view-source` của `/products/<id>` có `<title>` và `og:*` đúng.
- [ ] `npm run typecheck && npm run lint && npm test && npm run build` xanh toàn workspace.
- [ ] Commit theo từng route.

---

## Phase 4: Dọn dẹp & tối ưu (sau khi Phase 3 ổn định)

1. Xóa phần Vite khỏi storefront: `index.html`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `vercel.json`, `react-router-dom`, `react-helmet-async`, `vite`, `@vitejs/plugin-react` và `lib/router.tsx` (nếu đã thay hết bằng `next/*`).
2. `vitest.config.ts` của storefront: giữ `environment: 'node'` cho test thuần; test component/hook (`*.test.tsx`) dùng `// @vitest-environment jsdom` nếu cần (jsdom đã có trong devDependencies).
3. (Tùy chọn) Chuyển Home, Category, ProductDetail sang server component lấy dữ liệu trực tiếp để cải thiện SEO/LCP; chuyển `<img>` → `next/image`.
4. Cập nhật `README.md` gốc: cấu trúc thư mục, cách chạy (`npm run dev:storefront`, `npm run dev:admin`), env của từng app.

---

## Phase 5: Backend/Deploy

1. Backend `.env.example`: `FRONTEND_URL` ghi rõ có thể gồm nhiều origin (storefront + admin), ví dụ `http://localhost:5173,http://localhost:5174`. Không sửa logic CORS (đã hỗ trợ danh sách + localhost + vercel.app).
2. Rà biến backend dùng làm URL redirect sau thanh toán (MoMo/VNPay return URL, link trong email OTP/đơn hàng): phải trỏ về domain **storefront**, route `/payment-return` giữ nguyên.
3. Vercel: tạo 2 project.
   - `storefront`: Root Directory `frontend/storefront`, framework Next.js, cần cho phép đọc `../shared` (bật *Include source files outside of the Root Directory*), install command chạy ở `frontend/` (`npm ci`).
   - `admin`: Root Directory `frontend/admin`, framework Vite, giữ `vercel.json` rewrite SPA.
4. Biến môi trường:
   - storefront: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_IMAGE_URL`, `NEXT_PUBLIC_ADMIN_URL`
   - admin: `VITE_API_URL`, `VITE_IMAGE_URL`

### Gate cuối

- [ ] CI xanh trên PR (check:i18n, lint, typecheck, test, build cho cả hai app).
- [ ] Smoke test trên môi trường deploy thử: storefront ↔ backend (CORS ok), admin ↔ backend (CORS + websocket ok).
- [ ] Phiên đăng nhập admin và storefront độc lập nhau (khác origin) là hành vi **mong đợi**.

---

## Rủi ro đã biết & cách xử lý

| Rủi ro | Biện pháp |
|---|---|
| Hydration mismatch do `localStorage` | Quy tắc 3.1(a): mặc định cố định rồi đọc trong `useEffect` |
| `useSearchParams` làm build Next lỗi | Luôn bọc `Suspense` |
| Tailwind không quét class trong `shared` | Thêm path `../shared/src/**` vào `content` của cả hai app |
| `shared` đọc env trực tiếp | Dùng `configureShared()` (Phase 1.2) |
| `check-i18n` không quét hết code sau khi tách | Sửa script quét cả 3 package (Phase 1.2) |
| Component trong `shared` phụ thuộc router | Truyền callback/render prop, không import `react-router-dom` trong shared |
| Mất link `/admin` trong storefront | Dùng `NEXT_PUBLIC_ADMIN_URL`, ẩn nếu rỗng |
| `adminToken` trong localStorage (1 chỗ) | Kiểm tra còn dùng không; nếu là code chết thì xóa, nếu dùng thì thống nhất sang `token` |
| Thay đổi URL admin (bỏ `/admin`) bỏ sót chỗ | `grep -rn '"/admin' frontend/admin/src` phải rỗng sau Phase 1 |

## Quy ước làm việc cho agent

- Mỗi Phase tạo nhánh riêng (`feat/split-frontend-p1`, `...-p2`...), commit nhỏ, mô tả rõ.
- Trước khi sửa hàng loạt import, chạy `git status` sạch và `typecheck` để có baseline.
- Khi gặp điểm chưa rõ về nghiệp vụ (ví dụ key `adminToken`), **dừng và ghi chú vào `MIGRATION_NOTES.md`** thay vì đoán.
- Không nâng cấp phiên bản thư viện ngoài những gì plan yêu cầu.
- Sau mỗi Gate, ghi lại kết quả (pass/fail, ghi chú) vào `MIGRATION_NOTES.md`.
