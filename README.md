# Đồ Án Website Bán Quần Áo (Clothing Shop Project)

Website thương mại điện tử chuyên bán quần áo và thời trang, tích hợp hệ thống quản lý bán hàng, gợi ý sản phẩm liên quan, xác thực OTP và thanh toán trực tuyến dành cho đồ án sinh viên.

![Test suites](https://img.shields.io/badge/test--suites-50-blue?logo=jest)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?logo=tailwindcss&logoColor=white)

---

## Tính Năng Chính

### Dành Cho Khách Hàng (Customer)
- **Xem & Tìm kiếm sản phẩm**: Lọc theo danh mục, khuyến mãi, danh sách sản phẩm nổi bật.
- **Thông báo thời gian thực**: Nhận thông báo qua Dropdown Chuông khi trạng thái đơn hàng thay đổi, lưu lịch sử, đánh dấu đã đọc (Socket.io + DB).
- **Tự động định vị & Nhập địa chỉ (Nominatim API)**: Tích hợp OpenStreetMap Nominatim API tự động lấy địa chỉ giao hàng chính xác qua GPS hoặc định vị IP.
- **Giỏ hàng & Đặt hàng**: Thêm/xóa sản phẩm vào giỏ hàng, áp dụng Voucher giảm giá và tiến hành đặt hàng.
- **Thanh toán trực tuyến đa kênh (MoMo / VNPay)**: Tích hợp cổng thanh toán MoMo và VNPay-QR (Mobile Banking / NCB Sandbox).
- **Thanh toán lại & Đổi phương thức thanh toán (Repayment)**: Đơn MoMo/VNPay chưa hoàn tất có thể thanh toán lại hoặc chuyển sang COD (chỉ khi đơn còn **Chờ xử lý / Đã xác nhận**; backend cũng chặn khởi tạo thanh toán mới ở trạng thái khác) ngay tại **Tra cứu đơn hàng**, **Hồ sơ cá nhân** và **Trang kết quả thanh toán** (`POST /orders/:id/repay`).
- **Tự động hủy đơn online chưa thanh toán (Auto-Cancel sau 30 phút)**: Job nền `autoCancelService` (`node-cron`, quét mỗi 5 phút) tự động hủy đơn **Pending + Unpaid** của MoMo/VNPay quá 30 phút, hoàn lại tồn kho đã giữ và gửi email thông báo cho khách. Đơn COD không bị tự hủy vì shop chủ động xác nhận/hủy.
- **Tra cứu đơn hàng & Gửi mã OTP (Brevo API)**: Gửi mã xác nhận OTP tức thì qua Email thông qua dịch vụ Brevo HTTP API để tra cứu đơn hàng nhanh chóng mà không cần đăng nhập.
- **Yêu cầu đổi trả hàng & Hủy yêu cầu (Return/Refund Request)**: Cho phép khách hàng gửi form yêu cầu đổi trả hàng (kèm ảnh bằng chứng & thông tin tài khoản ngân hàng hoàn tiền) hoặc hủy yêu cầu khi đang chờ xử lý (áp dụng cho cả Tài khoản thành viên và Khách tra cứu qua OTP). Chỉ nhận yêu cầu trong **7 ngày kể từ khi giao hàng** (backend chặn và trả cờ `can_return` để frontend ẩn nút; admin được xử lý ngoại lệ); khi hoàn tiền **không hoàn phí vận chuyển**.
- **Chế độ Giao diện Sáng / Tối (Dark & Light Mode)**: Hỗ trợ chuyển đổi giao diện mượt mà giữa chế độ Tối (Dark) và Sáng (Light), tự động nhận diện theme hệ thống và ghi nhớ cài đặt qua `localStorage`.
- **Hỗ trợ Đa ngôn ngữ (i18n & DB Localization)**: Chuyển đổi ngôn ngữ hiển thị linh hoạt cho cả giao diện tĩnh lẫn nội dung động trong CSDL.
- **Tài khoản & Đăng nhập**: Đăng nhập & Đăng ký bảo mật qua JWT Auth (băm mật khẩu `bcryptjs`, yêu cầu mật khẩu tối thiểu 8 ký tự khi đăng ký và đổi mật khẩu), hỗ trợ phân hạng thành viên (Membership) tự động theo tổng chi tiêu và % chiết khấu theo hạng. Luồng **Access Token (15 phút) + Refresh Token (7 ngày)** tự động làm mới phiên ngầm qua Axios interceptor — người dùng không bị đăng xuất đột ngột.
- **Gợi ý sản phẩm liên quan (Collaborative Filtering)**: Khối "Gợi ý cho bạn" trên **Trang chủ** trả về tối đa 8 sản phẩm dựa trên hành vi tương tác (`view` / `add_to_cart` / `purchase`) của những người dùng tương tự; khách chưa đăng nhập nhận sản phẩm ngẫu nhiên. Hệ thống loại các sản phẩm có tương tác `purchase` đã ghi nhận cho tài khoản. Lưu ý: hiện tương tác `purchase` được ghi nhận ngay khi tạo đơn, nên không đồng nghĩa đơn đã thanh toán thành công. Logic nằm trong `CustomerController.getRecommendations` và `CustomerProductService.getRecommendations`.
- **Tối ưu hiệu năng & SEO cơ bản**: Tối ưu tốc độ tải trang bằng Code-splitting với `React.lazy()` và `Suspense` (chỉ tải trang chủ ban đầu, tách riêng các bundle Admin và trang phụ); quản lý thẻ tiêu đề, mô tả và chia sẻ mạng xã hội (Open Graph) động theo từng sản phẩm/danh mục thông qua `react-helmet-async`.
- **Trợ lý AI Chatbot**: Tư vấn, giải đáp thắc mắc khách hàng trực tiếp sử dụng Google Gemini AI API.
- **Trang Chính sách bán hàng (`/sales-policy`)**: Tổng hợp chính sách giao hàng – đổi trả – thanh toán cùng ưu đãi giảm giá và đặc quyền hội viên VIP.
- **Trang 404**: Hiển thị trang "Không tìm thấy" thân thiện khi truy cập URL không hợp lệ.

### Dành Cho Quản Trị Viên (Admin)
- **Thống kê & Tổng quan (Dashboard)**: Theo dõi tức thì 8 chỉ số vận hành trọng yếu (Tổng tồn kho, Đơn hàng, Danh mục, Người dùng, Banner, Voucher hoạt động, Chiến dịch giảm giá, Khuyến mãi Mua X Tặng Y) được tối ưu tính toán bằng 1 truy vấn SQL duy nhất.
- **Báo cáo Phân tích Tài chính (Financial Analytics & Report)**: Trang báo cáo trực quan bằng Google Charts, số liệu được chốt đến hết ngày hôm qua để tránh nhảy số trong ngày: thẻ tổng quan cho 7 & 30 ngày gần nhất (đơn hàng, doanh thu, lợi nhuận tính từ chênh lệch giá bán và giá nhập, sản phẩm đã bán); biểu đồ cột doanh thu & lợi nhuận theo từng ngày (7 ngày gần nhất); biểu đồ đường xu hướng 12 tháng; cùng 4 biểu đồ tròn phân tích doanh thu theo danh mục, vòng đời trạng thái đơn hàng, kết quả phê duyệt yêu cầu đổi trả và lý do trả hàng.
- **Quản lý sản phẩm & Tồn kho (Product & Inventory)**: Thêm, sửa, xóa sản phẩm, quản lý đa biến thể (kích thước, màu sắc, hình ảnh theo màu), kiểm soát tồn kho theo thời gian thực, phân trang server-side kết hợp thanh bấm số trang và tìm kiếm đa trường.
- **Quản lý danh mục (Category Management)**: Phân loại danh mục theo nhóm đối tượng (Nam, Nữ, Unisex), tải ảnh đại diện danh mục.
- **Quản lý đơn hàng & Đổi trả (Order & Return Management)**: Theo dõi đơn hàng theo từng tab trạng thái; cập nhật tiến độ giao hàng; xét duyệt hoặc từ chối các yêu cầu đổi trả hàng của khách kèm hình ảnh bằng chứng; phân trang server-side và bộ lọc nâng cao.
- **Nhật ký Trạng thái Thanh toán (Payment Audit Log)**: Bảng `payment_status_logs` ghi nhận cập nhật trạng thái thủ công từ Admin, các chuyển trạng thái `Paid → Refunded` khi đơn đã thanh toán chuyển sang `Cancelled` / `Return_Approved`, và trường hợp khôi phục `Refunded → Paid` khi thao tác hoàn trả được đảo lại trước khi tiền thực sự được hoàn. Nhật ký lưu trạng thái cũ → mới, người thao tác (`changed_by`) và ghi chú. Ngoài các lần đổi trạng thái, callback thanh toán đến muộn khi đơn đã sang trạng thái không còn đủ điều kiện thanh toán sẽ được ghi thành bản ghi cảnh báo đối soát (trạng thái cũ/mới giữ nguyên), thay vì tự đánh dấu `Paid` hoặc `Refunded`. Đây chỉ là ghi nhận cần xử lý: hệ thống chưa tự động gọi API hoàn tiền nhà cung cấp; cửa hàng phải đối soát giao dịch thực tế và hoàn tiền nếu cần.
- **Quản lý người dùng & Phân quyền (User Management)**: Xem danh sách tài khoản, tìm kiếm & lọc theo vai trò (Customer/Admin), tạo mới tài khoản quản trị, đặt lại mật khẩu, gán hạng thành viên; chốt an toàn không cho xóa tài khoản đã có đơn hàng và chống tự khóa/hạ quyền admin cuối cùng.
- **Quản lý Banner quảng cáo (Banner Management)**: Tải lên và quản lý danh sách banner trình chiếu trên Hero Carousel trang chủ.
- **Quản lý Mã giảm giá (Vouchers)**: Thiết lập mã voucher giảm theo %, quy định giá trị đơn hàng tối thiểu, mức giảm tối đa (chặn trên theo số tiền), giới hạn lượt sử dụng và thời gian hiệu lực.
- **Chiến dịch Giảm giá (Flash Sale / Discounts)**: Thiết lập các đợt giảm giá trực tiếp theo % trên từng sản phẩm hoặc danh mục sản phẩm theo khung thời gian.
- **Chương trình Khuyến mãi (Promotions - Buy X Get Y)**: Cấu hình quy tắc mua sản phẩm X tặng kèm sản phẩm Y, tự động bổ sung quà tặng vào đơn hàng và ràng buộc khi đổi trả.
- **Thông báo Real-time + Lịch sử (Socket.io + DB)**: Admin nhận thông báo Toast tức thì ở mọi trang quản trị khi có: *Đơn hàng mới*, *Khách gửi yêu cầu đổi trả*, *Khách hủy đơn hàng*, hoặc *Thanh toán trực tuyến thành công*. Đồng thời lưu lịch sử thông báo vào DB (bảng `notifications`), hiển thị qua **Dropdown Chuông** trên navbar, hỗ trợ đánh dấu đã đọc đơn lẻ hoặc tất cả. **Khách hàng** cũng nhận thông báo realtime khi admin cập nhật trạng thái đơn hàng hoặc duyệt trả hàng.
- **CI/CD Pipeline**: Tích hợp GitHub Actions tự động cài đặt dependency, generate Prisma Client, rà soát chuỗi dịch i18n (`npm run check:i18n`) và chạy kiểm tra (gồm Jest/Vitest, kiểm tra kiến trúc NestJS, typecheck, lint/build và kiểm tra key song ngữ `vi`/`en`). Workflow chạy khi push lên nhánh `main` / `master` hoặc tạo Pull Request nhắm đến các nhánh này.

---

## Kiến Trúc Hệ Thống

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ CLIENT BROWSER                                                               │
│ React 19 · TypeScript · Vite · TailwindCSS                                   │
│                                                                              │
│ ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────────────┐ │
│ │    Customer UI     │  │      Admin UI      │  │     Shared frontend      │ │
│ │Shop / cart / search│  │Dashboard / reports │  │   Context / Providers    │ │
│ │ Checkout / orders  │  │ Products / orders  │  │  Hooks · API · Services  │ │
│ └────────────────────┘  └────────────────────┘  └──────────────────────────┘ │
│                                                                              │
│ ┌────────────────────┐  ┌──────────────────────────────────────────────────┐ │
│ │      Auth UI       │  │   Router · Locales / i18n · API client (Axios)   │ │
│ │  Login / Register  │  │   Socket.io client · Theme / Language · Utils    │ │
│ │    JWT session     │  │        Frontend state and shared helpers         │ │
│ └────────────────────┘  └──────────────────────────────────────────────────┘ │
│ Frontend calls the backend over HTTP / REST (Axios, JWT bearer token)        │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │                                        
                       HTTP / REST API · JWT bearer token                       
                                       ▼                                        
┌──────────────────────────────────────────────────────────────────────────────┐
│ BACKEND — Node.js + NestJS 11 + TypeScript                                   │
│                                                                              │
│ ┌──────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐ │
│ │     Modules      │   │      Controllers      │   │     Prisma Client     │ │
│ │ customer / admin │ → │    customer / admin   │ → │    PostgreSQL    │ │
│ │  notifications   │   │ order / payment / ... │   │    adapter-pg    │ │
│ └──────────────────┘   └───────────────────────┘   └───────────────────────┘ │
│                                                                              │
│ Guards · Authentication / guest OTP · Zod validation                         │
│ Services · Order / payment / inventory · Email queue · Shipping              │
│ Notifications · Product recommendations · Scheduled auto-cancel              │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │                                        
                                       ▼                                        
┌──────────────────────────────────────────────────────────────────────────────┐
│ EXTERNAL SERVICES                                                            │
│                                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐   │
│  │    Brevo     │ │     MoMo     │ │    VNPay     │ │   Google Gemini    │   │
│  │ Email / OTP  │ │   Payments   │ │   Payments   │ │     AI chatbot     │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────────────┘   │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                        OpenStreetMap Nominatim                         │  │
│  │                       Geocoding / address lookup                       │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Công Nghệ Sử Dụng

- **Frontend**: React.js (Vite), TypeScript, React Router, TailwindCSS, Axios, @tanstack/react-query, react-helmet-async (SEO & Meta Tags), Lucide Icons, React Google Charts, OpenStreetMap Nominatim API, React Context API, `socket.io-client`.
- **Backend**: Node.js, TypeScript, **NestJS 11** (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/throttler`, `@nestjs/websockets`), Prisma ORM (`schema.prisma`, generated Prisma Client và `PrismaService` dùng Dependency Injection), PostgreSQL (`@prisma/adapter-pg` + `pg` driver), JSON Web Token (JWT), `bcryptjs`, Multer, `helmet`, `zod`, `node-cache`, `async`, `node-cron`, `socket.io`.
- **Testing & CI/CD**:
  - **Backend**: Jest + `@swc/jest` + `jest-mock-extended` + `supertest` (mock toàn bộ — không cần DB thật).
  - **Frontend**: Vitest.
  - **CI/CD**: GitHub Actions Pipeline.
- **Dịch vụ tích hợp & AI**:
  - **Brevo API (Sendinblue)**: Gửi email giao dịch / mã OTP xác thực.
  - **Cổng thanh toán MoMo & VNPay**: Xử lý thanh toán trực tuyến qua MoMo và VNPay-QR (Mobile Banking / NCB Sandbox).
  - **Google Gemini AI API**: Trợ lý tư vấn AI Chatbot tự động cho khách hàng (sử dụng SDK `@google/generative-ai` trực tiếp trong TypeScript).
  - **OpenStreetMap Nominatim**: Định vị vị trí và tự động chuyển đổi tọa độ GPS thành địa chỉ giao hàng.
  - **Gợi ý sản phẩm thông minh (Recommendation System)**: Thuật toán lọc cộng tác (Collaborative Filtering) tích hợp trực tiếp trong Backend Node.js / Prisma.

---

## Cấu Trúc Thư Mục

```text
clothing-shop-project/
├── .github/workflows/ci.yml       # CI: backend Jest/build/typecheck/architecture + frontend checks
├── backend/
│   ├── prisma/                    # schema.prisma, seed.ts, test-only legacy client.ts
│   ├── src/
│   │   ├── main.ts                # NestJS bootstrap trên Express HTTP adapter
│   │   ├── app.module.ts          # Root module
│   │   ├── admin/                 # AdminController (54 routes), module và domain services
│   │   ├── customer/              # CustomerController (42 routes), module và domain services
│   │   ├── notification/          # NotificationController (3 routes), module và service
│   │   ├── common/                # Guards, decorators, exception filter, validation pipe, upload interceptor
│   │   ├── prisma/                # PrismaModule + PrismaService (DI)
│   │   ├── socket/                # SocketService + SocketIoAdapter
│   │   ├── services/              # Shared order, inventory, email và automation services
│   │   ├── utils/                 # Payment, email, shipping, cache và helpers
│   │   ├── constants/             # Order status và return policy
│   │   ├── types/                 # Domain types và Zod schemas
│   │   ├── validators/            # Domain validation helpers
│   │   ├── public/images/         # Ảnh seed/static, serve tại /public
│   │   └── __tests__/             # 33 Jest suites: legacy regression, services, utilities, migration
│   ├── test-fixtures/             # Snapshot Express cũ chỉ dùng bởi regression tests, không chạy runtime
│   ├── scripts/                   # check-nestjs-migration.cjs và check-no-any.cjs
│   ├── uploads/                   # Ảnh upload runtime, không commit file upload
│   ├── prisma.config.ts
│   ├── nest-cli.json
│   └── package.json
└── frontend/
    ├── src/                       # React pages, components, hooks, context, services, utils, locales
    ├── scripts/                   # i18n validation và tiện ích source
    └── vite.config.ts / vitest.config.ts / tailwind.config.js
```

**Lưu ý kiến trúc:** NestJS xử lý toàn bộ controller và business services; Express được giữ lại duy nhất làm HTTP adapter qua `@nestjs/platform-express`. Các snapshot Express trong `backend/test-fixtures/` và `backend/prisma/client.ts` chỉ phục vụ một số regression tests, không được import vào runtime.
---

## Cấu Hình Biến Môi Trường (Environment Variables)

### 1. Backend (`backend/.env`)

| Tên biến | Mô tả | Mẫu giá trị |
| --- | --- | --- |
| `PORT` | Cổng chạy server Backend | `5000` |
| `FRONTEND_URL` | Địa chỉ URL của Frontend | `http://localhost:5173` |
| `BACKEND_URL` | URL public Backend (dùng cho Webhook IPN Callback) | `https://your-ngrok-url.ngrok-free.app/api` |
| `DATABASE_URL` | Chuỗi kết nối CSDL PostgreSQL qua Prisma ORM | `postgresql://username:password@localhost:5432/shopdb?schema=public` |
| `JWT_SECRET` | Khóa bí mật dùng để mã hóa & xác thực Access Token (15 phút) | `your_super_secret_jwt_key` |
| `JWT_REFRESH_SECRET` | Khóa bí mật riêng để mã hóa Refresh Token (7 ngày) | `your_super_secret_refresh_key` |
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
| `STRICT_ENV_CHECK` | Khi `true`, server dừng khởi động nếu thiếu biến môi trường bắt buộc; production luôn kiểm tra nghiêm ngặt | `false` |

### 2. Frontend (`frontend/.env`)

| Tên biến | Mô tả | Mẫu giá trị |
| --- | --- | --- |
| `VITE_API_URL` | URL gốc của API Backend | `http://localhost:5000/api` |
| `VITE_IMAGE_URL` | URL gốc phục vụ file ảnh tĩnh từ Backend | `http://localhost:5000` |

---

## Hướng Dẫn Cài Đặt & Khởi Động Dự Án

Yêu cầu database: PostgreSQL 14+ (local hoặc dịch vụ managed). Tạo database `shopdb` trước khi chạy backend, ví dụ `createdb shopdb`.

### 1. Cấu hình & Khởi động Backend (`/backend`)

```bash
cd backend
createdb shopdb  # nếu database chưa tồn tại và PostgreSQL CLI đã được cài
cp .env.example .env
```

- Chỉnh `DATABASE_URL` trong `backend/.env` trước khi cài dependencies (Prisma 7 đọc biến này khi generate client), ví dụ:
  ```env
  DATABASE_URL="postgresql://postgres:your_password@localhost:5432/shopdb?schema=public"
  ```
- Cập nhật các thông tin tích hợp nếu sử dụng: Brevo (`BREVO_API_KEY`), MoMo (`MOMO_SECRET_KEY`...), Google Gemini (`GOOGLE_API_KEY`). Sau đó cài dependencies:
  ```bash
  npm ci --legacy-peer-deps
  ```
- Khởi tạo bảng và đồng bộ Schema vào CSDL PostgreSQL bằng Prisma:
  ```bash
  npx prisma db push
  ```

- Nạp dữ liệu tài khoản Admin & Dữ liệu mẫu (Seed Data):
  ```bash
  npm run seed
  ```
  > **Lưu ý:** lệnh seed là *reset toàn bộ* — nó xoá hết người dùng, đơn hàng, sản phẩm, voucher... rồi tạo lại dữ liệu mẫu (kể cả tài khoản Admin). Chỉ chạy khi mới thiết lập dự án hoặc khi muốn xoá sạch dữ liệu. Tài khoản đăng nhập sau khi seed: xem mục **Tài Khoản Mặc Định (Seed)** bên dưới.
  > Source code/schema đã chuyển sang PostgreSQL nhưng không tự sao chép dữ liệu đang nằm trong máy chủ MySQL cũ. Nếu cần giữ dữ liệu thật, phải export/dump MySQL và chuyển dữ liệu riêng; không chạy seed trên database đã có dữ liệu cần giữ.
  > Seed có PostgreSQL advisory lock `pg_try_advisory_lock(...)`: nếu một tiến trình seed khác đang chạy, lệnh thứ hai sẽ dừng ngay và báo lỗi thay vì xoá dữ liệu giữa chừng.

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

Repository hiện có **33 backend Jest suites** và **17 frontend Vitest suites**. Đây là số test suite được kiểm kê từ source; số test case thực tế sẽ do Jest/Vitest báo tại thời điểm chạy.

### 1. Backend (Jest)

```bash
cd backend
npm ci --legacy-peer-deps
npm run db:generate
npm run check:nestjs-migration
npm run build
npm run typecheck
npm test -- --runInBand
npm run check:no-any
```

Các nhóm test backend:

| Nhóm | Số suite | Phạm vi |
|---|---:|---|
| `legacy-regression/` | 14 | Regression tests cho quy tắc nghiệp vụ/response lịch sử; một số test import snapshot Express từ `test-fixtures`, không phải HTTP test của NestJS runtime |
| `services/` | 9 | Unit tests cho catalog, promotion, notification, pricing, AI, discount allocation và order gift quota |
| `utils/` | 7 | Payment signature, email, environment, PostgreSQL config, return policy và shipping |
| `migration/` | 1 | Guardrails kiến trúc NestJS: 99 routes, DI, adapter, SQL và validation/upload |
| `pipes/` | 1 | ZodValidationPipe và response validation |
| `prisma/` | 1 | Seed/client-related checks |
| **Tổng** | **33** | Test suites hiện có trong `backend/src/__tests__/` |

**Giới hạn:** regression tests dựa trên `test-fixtures` khóa lại các quy tắc cũ, không thay thế việc kiểm thử trực tiếp NestJS HTTP layer. Cần bổ sung/chạy integration tests với database staging và sandbox payment trước khi deploy.

### 2. Frontend (Vitest)

```bash
cd frontend
npm ci
npm test
npm run check:i18n
npm run lint
npm run typecheck
npm run build
```

Frontend có 17 test suites bao phủ shipping/order/currency/promotion, i18n và API errors, return requests, checkout/cart pricing, các customer hooks và AI chat UI. Một số test component/hook dùng React Testing Library và `jsdom`.

### 3. CI

GitHub Actions chạy backend tests, Prisma Client generation, typecheck, `check:no-any`, migration architecture checker và production build; frontend chạy tests, i18n check, lint, typecheck và production build. Workflow được định nghĩa tại [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
---

## Tài Khoản Mặc Định (Seed)

Sau khi chạy lệnh `npm run seed`, tất cả tài khoản mẫu dùng chung mật khẩu **`123456`**:

| Vai trò | Email |
|---|---|
| Quản trị (`admin`) | `admin@shop.com` |
| Khách hàng (`customer`) | `customer@shop.com` |

> Ngoài ra seed còn tạo 10 khách hàng mẫu (`vana@example.com`, `thib@example.com`, ...) làm dữ liệu nền cho đơn hàng và tương tác sản phẩm, cũng dùng mật khẩu `123456`.
> Đây chỉ là tài khoản dành cho môi trường dev/demo. Hãy đổi mật khẩu hoặc xoá các tài khoản này nếu triển khai thật.
> *Lưu ý:* Mật khẩu `123456` (6 ký tự) chỉ áp dụng cho tài khoản mẫu nạp sẵn từ seed dev. Khi người dùng đăng ký mới hoặc đổi mật khẩu trên ứng dụng, hệ thống yêu cầu mật khẩu tối thiểu **8 ký tự** theo validation schema.

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

## Backend CI diagnostics

Backend GitHub Actions logs now show a concise failure summary while preserving the full Jest output in the `backend-test-log` artifact. The CI pipeline also runs typecheck, migration checks, and production build after unit-test failures when setup and Prisma generation have succeeded.
