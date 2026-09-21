# Đồ Án Website Bán Quần Áo (Clothing Shop Project)

Website thương mại điện tử chuyên bán quần áo và thời trang, tích hợp hệ thống quản lý bán hàng, gợi ý sản phẩm liên quan, xác thực OTP và thanh toán trực tuyến dành cho đồ án sinh viên.

![Tests](https://img.shields.io/badge/tests-passing-brightgreen?logo=jest)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?logo=tailwindcss&logoColor=white)

---

## Tính Năng Chính

### Dành Cho Khách Hàng (Customer)
- **Xem & Tìm kiếm sản phẩm**: Lọc theo danh mục, khuyến mãi, danh sách sản phẩm nổi bật.
- **Tự động định vị & Nhập địa chỉ (Nominatim API)**: Tích hợp OpenStreetMap Nominatim API tự động lấy địa chỉ giao hàng chính xác qua GPS hoặc định vị IP.
- **Giỏ hàng & Đặt hàng**: Thêm/xóa sản phẩm vào giỏ hàng, áp dụng Voucher giảm giá và tiến hành đặt hàng.
- **Thanh toán trực tuyến đa kênh (MoMo / VNPay)**: Tích hợp cổng thanh toán MoMo và VNPay-QR (Mobile Banking / NCB Sandbox).
- **Tra cứu đơn hàng & Gửi mã OTP (Brevo API)**: Gửi mã xác nhận OTP tức thì qua Email thông qua dịch vụ Brevo HTTP API để tra cứu đơn hàng nhanh chóng mà không cần đăng nhập.
- **Yêu cầu đổi trả hàng & Hủy yêu cầu (Return/Refund Request)**: Cho phép khách hàng gửi form yêu cầu đổi trả hàng (kèm ảnh bằng chứng & thông tin tài khoản ngân hàng hoàn tiền) hoặc hủy yêu cầu khi đang chờ xử lý (áp dụng cho cả Tài khoản thành viên và Khách tra cứu qua OTP).
- **Chế độ Giao diện Sáng / Tối (Dark & Light Mode)**: Hỗ trợ chuyển đổi giao diện mượt mà giữa chế độ Tối (Dark) và Sáng (Light), tự động nhận diện theme hệ thống và ghi nhớ cài đặt qua `localStorage`.
- **Hỗ trợ Đa ngôn ngữ (i18n & DB Localization)**: Chuyển đổi ngôn ngữ hiển thị linh hoạt cho cả giao diện tĩnh lẫn nội dung động trong CSDL.
- **Tài khoản & Đăng nhập**: Đăng nhập & Đăng ký bảo mật qua JWT Auth (băm mật khẩu `bcryptjs`), hỗ trợ tích điểm hạng thành viên (Membership).
- **Gợi ý sản phẩm liên quan**: Gợi ý các sản phẩm cùng danh mục / cùng mức giá trên trang chi tiết sản phẩm (không dùng Machine Learning, logic lọc trong `productDetailController`).
- **Trợ lý AI Chatbot**: Tư vấn, giải đáp thắc mắc khách hàng trực tiếp sử dụng Google Gemini AI API.

### Dành Cho Quản Trị Viên (Admin)
- **Quản lý sản phẩm & Kho hàng**: Thêm, sửa, xóa sản phẩm, danh mục, kích thước, màu sắc và cập nhật số lượng tồn kho (hỗ trợ nhập dữ liệu đa ngôn ngữ Việt - Anh).
- **Quản lý đơn hàng & Đổi trả**: Xem danh sách đơn hàng, xem xét & duyệt/từ chối các yêu cầu đổi trả của khách hàng, cập nhật trạng thái xử lý/giao hàng/hủy đơn/hoàn trả.
- **Mã giảm giá & Khuyến mãi**: Tạo và quản lý Voucher, thiết lập chương trình khuyến mãi (Sale / Promotion).
- **Thống kê & Báo cáo**: Bảng điều khiển (Dashboard) xem báo cáo doanh thu, lượt bán và đơn hàng theo thời gian.

---

## Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│           React 19 + TypeScript + TailwindCSS + Vite            │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│   │  Customer UI │  │   Admin UI   │  │  Context API (6)     │  │
│   │  (Shop/Cart/ │  │  (Dashboard/ │  │  Auth/Cart/AIChat/   │  │
│   │   Orders +   │  │   Report/    │  │  Theme/Language/     │  │
│   │   Payment)   │  │   Orders/    │  │  Toast)              │  │
│   └──────────────┘  │   Products)  │  └──────────────────────┘  │
│   ┌──────────────┐  └──────────────┘  ┌──────────────────────┐  │
│   │  Auth UI     │  Hooks (21)        │  Services/Utils      │  │
│   │  (Login/     │  admin(11)/        │  apiClient/aiService │  │
│   │   Register)  │  customer(8)/      │  + 7 utils           │  │
│   └──────────────┘  auth(2)           └──────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP / REST API (Axios)
                             │ JWT Bearer Token
┌────────────────────────────▼────────────────────────────────────┐
│                    BACKEND — Node.js + Express 5                │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │   Routers   │→ │  Controllers │→ │   Prisma ORM Client    │  │
│  │ /api/...    │  │  admin (10)  │  │   (MySQL / MariaDB     │  │
│  │ /api/admin/ │  │  customer    │  │    via adapter)        │  │
│  │ (2 files)   │  │  (11)        │  └────────────────────────┘  │
│  └─────────────┘  └──────┬───────┘                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Middleware / Services / Utils               │   │
│  │ authenticateToken │ requireAdmin │ uploadMiddleware      │   │
│  │ Services (5): ai │ autoCancel │ discountAllocation │     │   │
│  │  interaction │ promotion                                 │   │
│  │ Utils (3): emailService │ momoService │ vnpayService     │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────┬──────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
│  │  Brevo   │  │  MoMo    │  │  VNPay   │  │ Google Gemini  │   │
│  │  (Email  │  │ Payment  │  │ Payment  │  │   AI Chatbot   │   │
│  │   OTP)   │  │ Gateway  │  │ Gateway  │  │                │   │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         OpenStreetMap Nominatim (Geocoding API)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Công Nghệ Sử Dụng

- **Frontend**: React.js (Vite), TypeScript, React Router, TailwindCSS, Axios, Lucide Icons, React Google Charts, OpenStreetMap Nominatim API, React Context API (Auth/Cart/AIChat/Theme/Language/Toast).
- **Backend**: Node.js, TypeScript, Express.js, Prisma ORM (Multilingual DB Schema, `schema.prisma` + `client.ts`), MySQL/MariaDB (`@prisma/adapter-mariadb` + `mariadb` driver), JSON Web Token (JWT), `bcryptjs`, Multer (`uploadMiddleware`), `express-rate-limit`, `qs`, `tsx`.
- **Testing**: Jest + `@swc/jest` + `jest-mock-extended` + `supertest` (mock toàn bộ — không cần DB thật).
- **Dịch vụ tích hợp & AI**:
  - **Brevo API (Sendinblue)**: Gửi email giao dịch / mã OTP xác thực.
  - **Cổng thanh toán MoMo & VNPay**: Xử lý thanh toán trực tuyến qua MoMo và VNPay-QR (Mobile Banking / NCB Sandbox).
  - **Google Gemini AI API**: Trợ lý tư vấn AI Chatbot tự động cho khách hàng (sử dụng SDK `@google/generative-ai` trực tiếp trong TypeScript).
  - **OpenStreetMap Nominatim**: Định vị vị trí và tự động chuyển đổi tọa độ GPS thành địa chỉ giao hàng.
  - **Gợi ý sản phẩm thông minh (Recommendation System)**: Thuật toán lọc cộng tác (Collaborative Filtering) tích hợp trực tiếp trong Backend Node.js / Prisma.

---

## Cấu Trúc Thư Mục

```
clothing-shop-project/
├── backend/
│   ├── prisma/                  # schema.prisma + client.ts + seed.ts (prisma.config.ts ở root backend)
│   ├── database/                # schema.sql (tham chiếu đọc nhanh) + seed_data.sql + views_indexes.sql
│   ├── src/
│   │   ├── index.ts             # entrypoint: CORS + /public + /uploads static + /api/admin + /api + autoCancelJob
│   │   ├── controllers/
│   │   │   ├── admin/           # 10 files: banner/category/inventory/membership/order/product/promotion/sale/stats/voucher
│   │   │   └── customer/        # 11 files: auth/banner/category/chat/membership/order/product/productDetail/promotion/sale/voucher
│   │   ├── middleware/          # authMiddleware (authenticateToken/requireAdmin/optionalAuth) + uploadMiddleware (Multer)
│   │   ├── routes/              # 2 files: admin/index.ts (/api/admin/*) + customer/index.ts (/api/*)
│   │   ├── services/            # 5 files: aiService (Gemini @google/generative-ai) / autoCancelService (job nền) / discountAllocationService / interactionService (lưu hành vi view/cart/purchase) / promotionService
│   │   ├── utils/               # 3 files: emailService (Brevo OTP) / momoService / vnpayService
│   │   ├── types/               # express.d.ts (mở rộng Request.user)
│   │   ├── generated/prisma/    # Prisma Client generate (không sửa tay)
│   │   ├── public/images/       # Ảnh sản phẩm + banner seed (serve tại /public)
│   │   └── __tests__/           # setup.ts + controllers(5) / middleware(1) / services(1) / utils(2) — 10 suites, 69 tests
│   ├── uploads/                 # Ảnh upload runtime qua Multer (serve tại /uploads)
│   ├── prisma.config.ts         # trỏ schema ./prisma/schema.prisma
│   └── package.json             # scripts: dev/start/seed/test/test:coverage (tsx + jest). Lưu ý: script `seed:admin` trỏ `prisma/seedAdmin.ts` nhưng file này hiện chưa có trong repo.
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── customer/        # 10: Home/Category/ProductDetail/Cart/Checkout/Search/OrderLookup/PaymentReturn/Profile/SalesPolicy
    │   │   ├── admin/           # 10: Dashboard/Report/OrderManager/ProductManager/ProductDetailManager/CategoryManager/BannerManager/SaleManager/VoucherManager/PromotionManager
    │   │   └── auth/            # 2: Login/Register
    │   ├── components/          # admin/auth/common/customer (4 nhóm)
    │   ├── context/             # 6: Auth/Cart/AIChat/Theme/Language/Toast
    │   ├── hooks/               # 21: admin(11: useDashboard/useReport/useOrderManager/...) / customer(8) / auth(2: useLogin/useRegister) + useAutoCancelCountdown
    │   ├── services/            # apiClient (Axios) + aiService
    │   ├── utils/               # 7: buyAgain/currency/date/image/order/promotion/shipping
    │   ├── locales/             # translations.ts (vi/en, check bằng npm run check:i18n trước build)
    │   ├── types/               # types/index.ts
    │   ├── styles/              # app.css + index.css
    │   └── assets/              # assets tĩnh build Vite
    ├── scripts/                 # check-i18n.cjs (chạy trước vite build)
    ├── public/                  # Assets tĩnh
    └── vite.config.ts + tailwind.config.js + postcss.config.js + vercel.json + eslint.config.js
```

---

## Cấu Hình Biến Môi Trường (Environment Variables)

### 1. Backend (`backend/.env`)

| Tên biến | Mô tả | Mẫu giá trị |
| --- | --- | --- |
| `PORT` | Cổng chạy server Backend | `5000` |
| `FRONTEND_URL` | Địa chỉ URL của Frontend | `http://localhost:5173` |
| `BACKEND_URL` | URL public Backend (dùng cho Webhook IPN Callback) | `https://your-ngrok-url.ngrok-free.app/api` |
| `DATABASE_URL` | Chuỗi kết nối CSDL MySQL / MariaDB qua Prisma ORM | `mysql://username:password@localhost:3306/shopdb` |
| `JWT_SECRET` | Khóa bí mật dùng để mã hóa & xác thực JWT | `your_super_secret_jwt_key` |
| `MOMO_PARTNER_CODE` | Partner Code do MoMo cấp (Test Sandbox) | `your_partner_code` |
| `MOMO_ACCESS_KEY` | Access Key kết nối cổng thanh toán MoMo | `your_access_key` |
| `MOMO_SECRET_KEY` | Secret Key tạo chữ ký điện tử HMAC-SHA256 MoMo | `your_secret_key` |
| `VNP_TMNCODE` | Terminal ID do VNPay cấp (Sandbox) | `your_vnp_tmncode` |
| `VNP_HASHSECRET` | Secret Key tạo chữ ký HMAC-SHA512 VNPay | `your_vnp_hashsecret` |
| `VNP_URL` | URL cổng thanh toán VNPay Sandbox | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` |
| `VNP_RETURNURL` | URL nhận kết quả thanh toán trên Frontend | `http://localhost:5173/payment-return` |
| `EMAIL_USER` | Email người gửi (đã verify trên Brevo Senders) | `your-email@gmail.com` |
| `BREVO_API_KEY` | API Key kết nối Brevo HTTP API gửi OTP | `your_brevo_api_key` |
| `GOOGLE_API_KEY` | API Key Google Gemini AI (dùng cho Chatbot / AI) | `your_google_gemini_api_key` |

### 2. Frontend (`frontend/.env`)

| Tên biến | Mô tả | Mẫu giá trị |
| --- | --- | --- |
| `VITE_API_URL` | URL gốc của API Backend | `http://localhost:5000/api` |
| `VITE_IMAGE_URL` | URL gốc phục vụ file ảnh tĩnh từ Backend | `http://localhost:5000` |

---

## Hướng Dẫn Cài Đặt & Khởi Động Dự Án

### 1. Cấu hình & Khởi động Backend (`/backend`)

```bash
cd backend
npm install
```

- Copy file `.env.example` thành `.env` trong thư mục `backend` và điền đầy đủ thông tin:
  ```bash
  cp .env.example .env
  ```
- Cập nhật các thông tin kết nối CSDL (`DATABASE_URL`), API Brevo gửi mail (`BREVO_API_KEY`), Cổng MoMo (`MOMO_SECRET_KEY`...), và Google Gemini AI (`GOOGLE_API_KEY`).

- Khởi tạo bảng và đồng bộ Schema vào CSDL MySQL bằng Prisma:
  ```bash
  npx prisma db push
  ```

- Nạp dữ liệu tài khoản Admin & Dữ liệu mẫu (Seed Data):
  ```bash
  npm run seed
  ```

- Chạy ứng dụng Backend:
  ```bash
  npm run dev
  ```
  *(Backend server lắng nghe tại: `http://localhost:5000`)*

---

### 2. Cấu hình & Khởi động Frontend (`/frontend`)

```bash
cd frontend
npm install
```

- Copy file `.env.example` thành `.env` trong thư mục `frontend`:
  ```bash
  cp .env.example .env
  ```

- Khởi động ứng dụng Frontend:
  ```bash
  npm run dev
  ```
  *(Frontend ứng dụng chạy tại: `http://localhost:5173`)*

---

## Testing

Project sử dụng **Jest** với **@swc/jest** transformer, toàn bộ test dùng mock — không cần kết nối database hay file `.env` thật.

```bash
cd backend

# Chạy toàn bộ unit tests
npm test

# Chạy kèm coverage report
npm run test:coverage
```

**Kết quả hiện tại:** `69 tests passed` across 10 test suites (chạy `npm test` để cập nhật lại con số sau khi thêm/sửa test).

| Test Suite | Số tests | Module được test |
| --- | --- | --- |
| `authMiddleware.test.ts` | 10 | JWT verify, requireAdmin, optionalAuth |
| `vnpayService.test.ts` | 12 | sortObject, verifyVnPayReturn, generateVnPayUrl |
| `momoService.test.ts` | 5 | HMAC-SHA256 signature verification |
| `authController.test.ts` | 8 | register, login (với Prisma mock) |
| `voucherController.test.ts` | 8 | Validation, discount calculation |
| `discountAllocationService.test.ts` | 10 | allocateItemDiscounts (pro-rata, gift, edge cases) |
| `returnRequest.test.ts` | 5 | submitReturnRequest (ràng buộc Buy X Get Y) |
| `createOrderGift.test.ts` | 3 | createOrder (ràng buộc quà tặng Buy X Get Y) |
| `adminOrderReturn.test.ts` | 4 | updateOrderStatus, rejectReturn (hoàn tác duyệt/từ chối) |
| `adminPaymentStatus.test.ts` | 4 | confirmPayment (chuyển đổi trạng thái thanh toán) |

---

## Tài Khoản Admin Mặc Định

Sau khi chạy lệnh `npm run seed`, hệ thống tự động khởi tạo tài khoản quản trị mặc định:

- **Email**: `admin@shop.com`
- **Mật khẩu**: `123456`
- **Quyền (Role)**: `admin`

---

## Tài Khoản Test Thanh Toán (Sandbox)

### 1. MoMo (Test Card - ATM Nội địa) 

| Tên chủ thẻ | Số thẻ | Hạn ghi trên thẻ | OTP |
| --- | --- | --- | --- |
| NGUYEN VAN A | `9704 0000 0000 0018` | 03/07 | OTP |

### 2. VNPay (Test Card - NCB Sandbox)

| Số thẻ | Tên chủ thẻ | Ngày phát hành | OTP |
| --- | --- | --- | --- |
| `9704198526191432198` | NGUYEN VAN A | 07/15 | `123456` |

> Lưu ý: Các thông tin thẻ trên chỉ dùng trong môi trường **Sandbox/Test**, không áp dụng cho giao dịch thật. Nếu MoMo/VNPay cập nhật lại bộ thẻ test, vui lòng tham khảo tài liệu chính thức:
> MoMo Sandbox: https://developers.momo.vn/v3/vi/docs/payment/onboarding/test-instructions/
> VNPay Sandbox: https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/