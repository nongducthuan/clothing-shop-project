# Đồ Án Website Bán Quần Áo (Clothing Shop Project)

Website thương mại điện tử chuyên bán quần áo và thời trang, tích hợp hệ thống quản lý bán hàng, gợi ý sản phẩm liên quan, xác thực OTP và thanh toán trực tuyến dành cho đồ án sinh viên.

![Tests](https://img.shields.io/badge/tests-322%20cases-blue?logo=jest)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8%20/%207.0-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white)
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
- **Tài khoản & Đăng nhập**: Đăng nhập & Đăng ký bảo mật qua JWT Auth (băm mật khẩu `bcryptjs`), hỗ trợ phân hạng thành viên (Membership) tự động theo tổng chi tiêu và % chiết khấu theo hạng. Luồng **Access Token (15 phút) + Refresh Token (7 ngày)** tự động làm mới phiên ngầm qua Axios interceptor — người dùng không bị đăng xuất đột ngột.
- **Gợi ý sản phẩm liên quan (Collaborative Filtering)**: Khối "Gợi ý cho bạn" trên **Trang chủ** trả về tối đa 8 sản phẩm dựa trên hành vi tương tác (`view` / `add_to_cart` / `purchase`) của những người dùng tương tự; khách chưa đăng nhập nhận sản phẩm ngẫu nhiên. Hệ thống loại các sản phẩm có tương tác `purchase` đã ghi nhận cho tài khoản. Lưu ý: hiện tương tác `purchase` được ghi nhận ngay khi tạo đơn, nên không đồng nghĩa đơn đã thanh toán thành công. Logic nằm trong `productController.getRecommendations` và `productService.getRecommendedProducts`.
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
- **CI/CD Pipeline**: Tích hợp GitHub Actions tự động cài đặt dependency, generate Prisma Client, rà soát chuỗi dịch i18n (`npm run check:i18n`) và chạy kiểm tra (**Backend 223 test cases, Frontend 99 test cases** — gồm kiểm tra key song ngữ `vi`/`en` khớp nhau). Workflow chạy khi push lên nhánh `main` / `master` hoặc tạo Pull Request nhắm đến các nhánh này.

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
│ BACKEND — Node.js + Express 5 + TypeScript                                   │
│                                                                              │
│ ┌──────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐ │
│ │      Routes      │   │      Controllers      │   │     Prisma Client     │ │
│ │ customer / admin │ → │    customer / admin   │ → │    MySQL / MariaDB    │ │
│ │  notifications   │   │ order / payment / ... │   │    adapter-mariadb    │ │
│ └──────────────────┘   └───────────────────────┘   └───────────────────────┘ │
│                                                                              │
│ Middleware · Authentication / guest OTP · Zod validation                     │
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

- **Frontend**: React.js (Vite), TypeScript, React Router, TailwindCSS, Axios, @tanstack/react-query, Lucide Icons, React Google Charts, OpenStreetMap Nominatim API, React Context API, `socket.io-client`.
- **Backend**: Node.js, TypeScript, Express.js, Prisma ORM (Multilingual DB Schema, `schema.prisma` + `client.ts`), MySQL/MariaDB (`@prisma/adapter-mariadb` + `mariadb` driver), JSON Web Token (JWT), `bcryptjs`, Multer, `express-rate-limit`, `helmet`, `zod`, `node-cache`, `async`, `node-cron`, `socket.io`.
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

```
clothing-shop-project/
├── .github/workflows/ci.yml     # CI: backend (test + typecheck + no-any) và frontend (test + i18n + lint + typecheck + build)
├── backend/
│   ├── prisma/                  # schema.prisma (+ model Notification: title/title_en/message/message_en/is_read) + client.ts + seed.ts (prisma.config.ts ở root backend)
│   ├── database/                # schema.sql (tham chiếu đọc nhanh) + seed_data.sql + views_indexes.sql
│   ├── src/
│   │   ├── index.ts             # entrypoint: CORS + /public + /uploads static + /api/admin + /api + /api/notifications + autoCancelJob
│   │   ├── controllers/
│   │   │   ├── admin/           # 14 files: adminReturn/banner/category/color/inventory/membership/order/product/promotion/sale/size/stats/user/voucher
│   │   │   └── customer/        # 14 files: auth/banner/category/chat/membership/order/orderLookup/payment/product/productDetail/promotion/return/sale/voucher
│   │   ├── middleware/          # 5 files: authMiddleware (authenticateToken/requireAdmin/optionalAuth) + guestOrderAccessMiddleware (khách tra cứu qua OTP) + uploadMiddleware (Multer) + errorMiddleware (globalErrorHandler) + validateMiddleware (Zod)
│   │   ├── routes/              # 3 files: admin/index.ts (/api/admin/*) + customer/index.ts (/api/*) + notificationRoutes.ts (/api/notifications/*)
│   │   ├── services/            # 13 files: AI / auto-cancel / discount allocation / interaction / order creation / filtering / order status (+ financial, inventory) / product / promotion / return / user
│   │   ├── utils/               # 14 files: error handling / cache / email (+ queue) / payment (MoMo, VNPay) / socket / MariaDB pool / shipping / env / pricing / order formatting
│   │   ├── constants/           # orderStatus.ts (luật chuyển trạng thái đơn) + returnPolicy.ts (đổi trả 7 ngày)
│   │   ├── validators/          # user.ts
│   │   ├── types/               # express.d.ts (mở rộng Request.user) + orderTypes.ts + schemas.ts (Zod validation schemas)
│   │   ├── generated/prisma/    # Prisma Client do `prisma generate` sinh ra (không commit, không sửa tay)
│   │   ├── public/images/       # Ảnh sản phẩm + banner seed (serve tại /public)
│   │   └── __tests__/           # setup.ts + controllers(14) / middleware(2) / services(3) / utils(7) / prisma(1) — 27 suites, 223 tests
│   ├── scripts/                 # check-no-any.cjs (CI chặn `any` tường minh)
│   ├── uploads/                 # Ảnh upload runtime qua Multer (tự tạo khi chạy, serve tại /uploads)
│   ├── prisma.config.ts         # trỏ schema ./prisma/schema.prisma
│   └── package.json             # scripts: dev/start/seed/test/test:coverage (tsx + jest)
└── frontend/              # 16 test suites, 99 test cases
    ├── src/
    │   ├── pages/
    │   │   ├── customer/        # 10: Home/Category/ProductDetail/Cart/Checkout/Search/OrderLookup/PaymentReturn/Profile/SalesPolicy
    │   │   ├── admin/           # 11: Dashboard/Report/OrderManager/ProductManager/ProductDetailManager/CategoryManager/BannerManager/SaleManager/VoucherManager/PromotionManager/UserManager
    │   │   ├── auth/            # 2: Login/Register
    │   │   └── NotFound.tsx     # Trang 404 hiển thị khi truy cập URL không hợp lệ
    │   ├── components/          # 117 files: admin (39) / auth (3) / common (4) / customer (71)
    │   ├── context/             # 6 cặp Context + Provider: Auth/Cart/AIChat/Theme/Language/Toast; kèm CartProvider.test.tsx
    │   ├── hooks/               # admin (12 + product/ 5 + user/ 5) / customer (16, gồm profileTypes.ts) / auth (2) + 2 hook dùng chung; 4 test hook
    │   ├── services/            # apiClient.ts (Axios) + aiService.ts; chưa có test file trong services/
    │   ├── utils/               # 12 helper + 9 file *.test.ts (Vitest), gồm priceUtils và productSearchUtils
    │   ├── locales/             # translations.ts + apiMessagePatterns.ts (vi/en, check bằng npm run check:i18n trước build) + 2 file *.test.ts
    │   ├── constants/           # tierConfig.ts
    │   ├── types/               # index.ts + aos.d.ts
    │   └── styles/              # app.css + index.css
    ├── scripts/                 # check-i18n.cjs (chạy trước vite build) + fix-mojibake.cjs (sửa lỗi double-encode)
    ├── public/                  # Assets tĩnh (public/assets + vite.svg)
    └── vite.config.ts + vitest.config.ts + tailwind.config.js + postcss.config.js + vercel.json + eslint.config.js
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
  > **Lưu ý:** lệnh seed là *reset toàn bộ* — nó xoá hết người dùng, đơn hàng, sản phẩm, voucher... rồi tạo lại dữ liệu mẫu (kể cả tài khoản Admin). Chỉ chạy khi mới thiết lập dự án hoặc khi muốn xoá sạch dữ liệu. Tài khoản đăng nhập sau khi seed: xem mục **Tài Khoản Mặc Định (Seed)** bên dưới.
  > Seed có khoá `GET_LOCK('clothing_shop_seed')`: nếu một tiến trình seed khác đang chạy, lệnh thứ hai sẽ dừng ngay và báo lỗi thay vì xoá dữ liệu giữa chừng.

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

Dự án có hệ thống Test tự động bao phủ cả Backend và Frontend, được cấu hình độc lập nhưng đều không yêu cầu kết nối CSDL thực (mock hoàn toàn).

### 1. Backend Testing (Jest)
Sử dụng **Jest** với **@swc/jest** transformer, `jest-mock-extended` và `supertest`.

```bash
cd backend

# Chạy toàn bộ unit tests
npm test

# Chạy kèm coverage report
npm run test:coverage
```

**Theo các test case được liệt kê trong source hiện có:** `223 test cases` across 27 test suites trong `backend/`.

| Test Suite | Số tests | Module được test |
| --- | --- | --- |
| `authMiddleware.test.ts` | 10 | JWT verify, requireAdmin, optionalAuth |
| `vnpayService.test.ts` | 12 | sortObject, verifyVnPayReturn, generateVnPayUrl |
| `momoService.test.ts` | 5 | HMAC-SHA256 signature verification |
| `authController.test.ts` | 8 | register, login (với Prisma mock) |
| `voucherController.test.ts` | 12 | Validation, discount calculation, điều kiện "đơn tối thiểu" tính theo tiền hàng gốc, quy tắc Buy X Get Y không cộng dồn |
| `discountAllocationService.test.ts` | 10 | allocateItemDiscounts (pro-rata, gift, edge cases) |
| `returnRequest.test.ts` | 10 | submitReturnRequest (ràng buộc Buy X Get Y; chính sách đổi trả 7 ngày: quá hạn → 400 và không tạo yêu cầu, dùng `updated_at` khi đơn cũ thiếu `delivered_at`, admin được xử lý ngoại lệ, người không phải chủ đơn vẫn nhận 403) |
| `createOrderGift.test.ts` | 7 | createOrder (quà Buy X Get Y, phân bổ qua size và snapshot giá vốn) |
| `createOrderTotal.test.ts` | 5 | createOrder (total_price, membership/voucher, làm tròn giá sale và snapshot giá vốn) |
| `repayOrder.test.ts` | 7 | Chặn đơn `Return_Approved`, `Shipping`, `Delivered`, `Return_Requested`, `Return_Rejected`; cho chuyển sang COD khi đơn còn `Pending` / `Confirmed` |
| `paymentSettlement.test.ts` | 2 | Chấp nhận callback hợp lệ và ghi nhận callback thành công đến muộn để đối soát, không tự đánh dấu đơn đang giao là đã thanh toán |
| `adminOrderReturn.test.ts` | 4 | updateOrderStatus, rejectReturn (hoàn tác duyệt/từ chối) |
| `adminPaymentStatus.test.ts` | 4 | confirmPayment (chuyển đổi trạng thái thanh toán) |
| `adminUser.test.ts` | 19 | getUsers, createUser, updateUser, resetUserPassword, deleteUser (chốt an toàn vai trò/xóa, gán hạng mặc định khi null) |
| `adminStats.test.ts` | 6 | getAdminStats (Dashboard, điều kiện lọc, lỗi 500, dùng snapshot và fallback giá vốn cho đơn cũ) |
| `adminOrderList.test.ts` | 9 | getOrders (phân trang, tab Đơn hàng/Đổi trả, lọc trạng thái, chặn limit, lỗi 500) |
| `adminProductList.test.ts` | 8 | getProducts (phân trang, tìm kiếm 3 tên, giới tính, nhóm danh mục, chế độ trả mảng cũ) |
| `mariadbPool.test.ts` | 13 | Cấu hình pool MariaDB dùng chung (chặn tái phát P2039 pool timeout: minimumIdle ≥ 1, acquireTimeout, SSL) |
| `seedEncoding.test.ts` | 2 | Chặn mojibake trong `prisma/seed.ts` (chuỗi tiếng Việt phải lưu UTF-8) |
| `validationSchemas.test.ts` | 19 | Chốt contract schema ↔ frontend (chặn tái phát lỗi strip `cartItems` → 500, payload checkout → 400, SĐT đa định dạng, mọi message lỗi đều có bản dịch `api_msg.*`) |
| `returnPolicy.test.ts` | 7 | Quy tắc đổi trả 7 ngày (`constants/returnPolicy.ts`): mốc `delivered_at` → fallback `updated_at`, biên đúng 7 ngày, cờ `can_return`/`return_deadline` trong `formatOrderResponse` |
| `envCheck.test.ts` | 15 | Kiểm tra biến môi trường bắt buộc khi khởi động (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, FRONTEND_URL, BACKEND_URL, VNP_TMNCODE, VNP_HASHSECRET, VNP_URL, VNP_RETURNURL) và chế độ fail-fast `STRICT_ENV_CHECK` |
| `promotionController.test.ts` | 3 | Phân bổ chung tồn kho quà cho nhiều khuyến mãi; từ chối giỏ hàng rỗng trước khi truy vấn DB |
| `pricing.test.ts` | 3 | Làm tròn giá sale và chuẩn hóa VNĐ nguyên. |
| `orderGiftQuota.test.ts` | 3 | Hoàn/trừ lại hạn mức quà khi hủy/khôi phục đơn. |
| `shippingUtils.test.ts` | 14 | Phí ship phía server: tách tỉnh/thành (bỏ mã bưu chính và "Việt Nam" ở cuối), so khớp theo cụm từ nguyên vẹn, vùng giao hàng, phụ phí số lượng. Phải khớp bản frontend. |
| `emailService.test.ts` | 6 | `sendEmail` gửi đúng tiêu đề/nội dung (escape HTML) thay vì mẫu OTP; `sendOtpEmail` dùng mẫu OTP vi/en; lỗi thiếu API key hoặc Brevo từ chối. |
| **Tổng cộng** | **223** | **27 test suites** — mock Prisma, không cần kết nối CSDL thật |

### 2. Frontend Testing (Vitest)
Sử dụng **Vitest** cho utility tests và test hook/component bằng React Testing Library khi cần; các test không gọi backend/database thật.

```bash
cd frontend

# Chạy toàn bộ frontend unit tests
npm test
```

**Theo các test case được liệt kê trong source hiện có:** `99 test cases` across 16 test suites trong `frontend/`.

| Test Suite | Số tests | Module được test |
| --- | --- | --- |
| `shippingUtils.test.ts` | 20 | Test phí vận chuyển, tách tên tỉnh/thành (bỏ mã bưu chính và "Việt Nam" ở cuối), so khớp theo cụm từ nguyên vẹn, vùng giao hàng, phụ thu. Phải khớp bản backend. |
| `orderUtils.test.ts` | 17 | Test luồng chuyển đổi trạng thái đơn hàng, validate thanh toán, điều kiện hiện nút thanh toán lại (`canRepayOrder`) và phân bổ số tiền hoàn (làm tròn VNĐ + bù trừ chênh lệch) cho từng sản phẩm trả hàng. |
| `currencyUtils.test.ts` | 7 | Test format tiền tệ Việt Nam Đồng (VND). |
| `translations.test.ts` | 3 | Chặn tái phát lỗi double-encode (mojibake), kiểm tra key vi/en khớp nhau. |
| `promotionUtils.test.ts` | 11 | Test rule Buy X Get Y: xác định sản phẩm X của quà tặng, và gom quà tặng Y phải hoàn kèm khi trả X. |
| `apiMessagePatterns.test.ts` | 5 | Dịch message backend ĐỘNG (có nội suy tên sản phẩm/mã đơn) qua regex → template, đủ cả 2 locale. |
| `apiErrorUtils.test.ts` | 6 | Ưu tiên hiển thị lỗi field cụ thể (`errors[0].message`) thay vì "Validation failed" chung chung; lỗi ngưỡng `min_order_value`; fallback khi mất mạng. |
| `returnRequestUtils.test.ts` | 6 | Test helper dựng danh sách sản phẩm trả, FormData và optimistic return request. |
| `useOrderActions.test.tsx` | 7 | Test hook thao tác đơn hàng: thanh toán lại, hủy đơn, hủy yêu cầu trả hàng và xử lý lỗi. |
| `checkoutPricing.test.ts` | 1 | Kiểm tra member discount chỉ tính trên sản phẩm đủ điều kiện cộng dồn. |
| `CartProvider.test.tsx` | 4 | Giỏ hàng chặn thêm sản phẩm hết hàng, giới hạn số lượng, giữ xử lý tồn kho bằng 0 và phục hồi khi localStorage lỗi. |
| `priceUtils.test.ts` | 3 | Giá sale được làm tròn theo VNĐ và xử lý discount sai/ngoài phạm vi. |
| `productSearchUtils.test.ts` | 5 | Tìm theo tên/mô tả tiếng Việt và tiếng Anh, không phân biệt dấu, xử lý query rỗng. |
| `useCategoryPage.test.tsx` | 1 | Chuyển danh mục từ trang 2 vẫn yêu cầu trang 1 của danh mục mới. |
| `useProductDetail.test.tsx` | 1 | Không giữ voucher/khuyến mãi/quà của sản phẩm trước khi mở sản phẩm không có ưu đãi. |
| `useCartPage.test.tsx` | 2 | Khuyến mãi không cộng dồn và tồn kho quà dùng chung được tính đúng. |
| **Tổng cộng** | **99** | **16 test suites** |

---

## Tài Khoản Mặc Định (Seed)

Sau khi chạy lệnh `npm run seed`, tất cả tài khoản mẫu dùng chung mật khẩu **`123456`**:

| Vai trò | Email |
|---|---|
| Quản trị (`admin`) | `admin@shop.com` |
| Khách hàng (`customer`) | `customer@shop.com` |

> Ngoài ra seed còn tạo 10 khách hàng mẫu (`vana@example.com`, `thib@example.com`, ...) làm dữ liệu nền cho đơn hàng và tương tác sản phẩm, cũng dùng mật khẩu `123456`.
> Đây chỉ là tài khoản dành cho môi trường dev/demo. Hãy đổi mật khẩu hoặc xoá các tài khoản này nếu triển khai thật.

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