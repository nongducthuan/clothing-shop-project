# Đồ Án Website Bán Quần Áo (Clothing Shop Project)

Website thương mại điện tử chuyên bán quần áo và thời trang, tích hợp hệ thống quản lý bán hàng, gợi ý sản phẩm AI, xác thực OTP và thanh toán trực tuyến dành cho đồ án sinh viên.

---

## Tính Năng Chính

### Dành Cho Khách Hàng (Client)
- **Xem & Tìm kiếm sản phẩm**: Lọc theo danh mục, khuyến mãi, danh sách sản phẩm nổi bật.
- **Tự động định vị & Nhập địa chỉ (Nominatim API)**: Tích hợp OpenStreetMap Nominatim API tự động lấy địa chỉ giao hàng chính xác qua GPS hoặc định vị IP.
- **Giỏ hàng & Đặt hàng**: Thêm/xóa sản phẩm vào giỏ hàng, áp dụng Voucher giảm giá và tiến hành đặt hàng.
- **Thanh toán trực tuyến MoMo ATM / QR**: Tích hợp cổng thanh toán MoMo (hỗ trợ ATM / QR Code / ViMoMo) bên cạnh phương thức COD truyền thống.
- **Tra cứu đơn hàng & Gửi mã OTP (Brevo API)**: Gửi mã xác nhận OTP tức thì qua Email thông qua dịch vụ Brevo HTTP API để tra cứu đơn hàng nhanh chóng mà không cần đăng nhập.
- **Tài khoản & Đăng nhập đa phương thức**: Đăng nhập qua tài khoản hệ thống (JWT Auth) hoặc Google OAuth 2.0, hỗ trợ tích điểm hạng thành viên (Membership).
- **Gợi ý sản phẩm thông minh (AI / Machine Learning)**: Gợi ý các sản phẩm phù hợp theo hành vi và lịch sử tương tác của người dùng (chạy trên môi trường Python).
- **Trợ lý AI Chatbot**: Tư vấn, giải đáp thắc mắc khách hàng trực tiếp sử dụng Google Gemini AI API.

### Dành Cho Quản Trị Viên (Admin)
- **Quản lý sản phẩm & Kho hàng**: Thêm, sửa, xóa sản phẩm, danh mục, kích thước, màu sắc và cập nhật số lượng tồn kho.
- **Quản lý đơn hàng**: Xem danh sách đơn hàng, duyệt đơn, cập nhật trạng thái xử lý/giao hàng/hủy đơn/hoàn trả.
- **Mã giảm giá & Khuyến mãi**: Tạo và quản lý Voucher, thiết lập chương trình khuyến mãi (Sale / Promotion).
- **Thống kê & Báo cáo**: Bảng điều khiển (Dashboard) xem báo cáo doanh thu, lượt bán và đơn hàng theo thời gian.

---

## Công Nghệ Sử Dụng

- **Frontend**: React.js (Vite), TypeScript, React Router, TailwindCSS, Bootstrap, Axios, Lucide Icons, Swiper, SweetAlert2, OpenStreetMap Nominatim API.
- **Backend**: Node.js, TypeScript, Express.js, Prisma ORM, MySQL/MariaDB, JSON Web Token (JWT), `bcryptjs`, Multer.
- **Dịch vụ tích hợp & AI**:
  - **Brevo API (Sendinblue)**: Gửi email giao dịch / mã OTP xác thực.
  - **Cổng thanh toán MoMo**: Xử lý thanh toán qua MoMo ATM / QR Code.
  - **Google OAuth 2.0 & Gemini AI**: Đăng nhập bằng Google và Trợ lý tư vấn AI Chatbot.
  - **OpenStreetMap Nominatim**: Định vị vị trí và tự động chuyển đổi tọa độ GPS thành địa chỉ giao hàng.
  - **Python (Recommender System)**: Thuật toán gợi ý sản phẩm cá nhân hóa.

---

## Cấu Hình Biến Môi Trường (Environment Variables)

### 1. Backend (`backend/.env`)

Tham khảo mẫu tại [backend/.env.example](file:///c:/Users/HP/Documents/GitHub/clothing-shop-project/backend/.env.example):

| Tên biến | Mô tả | Mẫu giá trị |
| --- | --- | --- |
| `PORT` | Cổng chạy server Backend | `5000` |
| `FRONTEND_URL` | Địa chỉ URL của Frontend | `http://localhost:5173` |
| `BACKEND_URL` | URL public Backend (dùng cho MoMo IPN Callback / Webhook) | `https://your-ngrok-url.ngrok-free.app/api` |
| `DATABASE_URL` | Chuỗi kết nối CSDL MySQL / MariaDB qua Prisma ORM | `mysql://username:password@localhost:3306/shopdb` |
| `JWT_SECRET` | Khóa bí mật dùng để mã hóa & xác thực JWT | `your_super_secret_jwt_key` |
| `MOMO_PARTNER_CODE` | Partner Code do MoMo cấp (Test Sandbox) | `your_partner_code` |
| `MOMO_ACCESS_KEY` | Access Key kết nối cổng thanh toán MoMo | `your_access_key` |
| `MOMO_SECRET_KEY` | Secret Key tạo chữ ký điện tử HMAC-SHA256 MoMo | `your_secret_key` |
| `EMAIL_USER` | Email người gửi (đã verify trên Brevo Senders) | `your-email@gmail.com` |
| `BREVO_API_KEY` | API Key kết nối Brevo HTTP API gửi OTP | `your_brevo_api_key` |
| `GOOGLE_CLIENT_ID` | Client ID Đăng nhập bằng Google (Google OAuth) | `your_google_client_id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Client Secret Đăng nhập bằng Google | `your_google_client_secret` |
| `GOOGLE_CALLBACK_URL` | URL Callback xử lý Google OAuth | `http://localhost:5000/api/auth/google/callback` |
| `GOOGLE_API_KEY` | API Key Google Gemini AI (dùng cho Chatbot / AI) | `your_google_gemini_api_key` |
| `PYTHON_PATH` | Đường dẫn file `python.exe` của môi trường venv | `D:\path\to\venv\Scripts\python.exe` |

### 2. Frontend (`frontend/.env`)

Tham khảo mẫu tại [frontend/.env.example](file:///c:/Users/HP/Documents/GitHub/clothing-shop-project/frontend/.env.example):

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
- Cập nhật các thông tin kết nối CSDL (`DATABASE_URL`), API Brevo gửi mail (`BREVO_API_KEY`), Cổng MoMo (`MOMO_SECRET_KEY`...), Google OAuth & Gemini AI (`GOOGLE_API_KEY`).

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

## Tài Khoản Admin Mặc Định

Sau khi chạy lệnh `npm run seed`, hệ thống tự động khởi tạo tài khoản quản trị mặc định:

- **Email**: `admin@shop.com`
- **Mật khẩu**: `123456`
- **Quyền (Role)**: `admin`
