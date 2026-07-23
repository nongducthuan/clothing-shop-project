# 🛒 Đồ Án Website Bán Quần Áo (Clothing Shop Project)

Website thương mại điện tử chuyên bán quần áo và thời trang, tích hợp hệ thống quản lý bán hàng và gợi ý sản phẩm dành cho đồ án sinh viên.

---

## ✨ Tính Năng Chính

### 👨‍💻 Dành Cho Khách Hàng (Client)
- **Xem & Tìm kiếm sản phẩm**: Lọc theo danh mục, khuyến mãi, danh sách sản phẩm nổi bật.
- **Giỏ hàng & Đặt hàng**: Thêm/xóa sản phẩm vào giỏ hàng, áp dụng Voucher và tiến hành thanh toán.
- **Tài khoản người dùng**: Đăng ký, đăng nhập (JWT Auth), tích điểm hạng thành viên (Membership).
- **Gợi ý sản phẩm**: Gợi ý các sản phẩm phù hợp theo hành vi/sở thích.
- **Trợ lý AI Chatbot**: Hỗ trợ tư vấn và giải đáp thắc mắc khách hàng.

### 🛡️ Dành Cho Quản Trị Viên (Admin)
- **Quản lý sản phẩm & Kho hàng**: Thêm, sửa, xóa sản phẩm, danh mục, cập nhật số lượng tồn kho.
- **Quản lý đơn hàng**: Xem danh sách đơn hàng, cập nhật trạng thái xử lý/giao hàng.
- **Mã giảm giá & Khuyến mãi**: Tạo và quản lý Voucher, chương trình khuyến mãi (Sale / Promotion).
- **Thống kê & Báo cáo**: Bảng điều khiển (Dashboard) xem báo cáo doanh thu và đơn hàng.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React.js (Vite), React Router, TailwindCSS, Bootstrap, Axios, Lucide Icons, Swiper, SweetAlert2.
- **Backend**: Node.js, Express.js, MySQL (`mysql2`), JSON Web Token (JWT), `bcryptjs`, Multer, Nodemailer / Resend.

---

## 🚀 Cách Khởi Động Dự Án

### 1. Cấu hình Backend (`/server`)

```bash
cd server
npm install
```

- Tạo cơ sở dữ liệu MySQL và cấu hình thông tin kết nối trong file `.env` (hoặc `src/db.js`).
- Khởi tạo tài khoản Admin mặc định:
  ```bash
  node seedAdmin.js
  ```
- Khởi động Server:
  ```bash
  npm run dev
  # hoặc npm start
  ```
  *(Server chạy tại: http://localhost:5000)*

---

### 2. Cấu hình Frontend (`/client`)

```bash
cd client
npm install
npm run dev
```
*(Frontend chạy tại: http://localhost:5173)*

---

## 🔑 Tài Khoản Admin Mặc Định

Tài khoản Admin được tạo tự động khi chạy `node seedAdmin.js`:

- **Email**: `admin@shop.com`
- **Mật khẩu**: `123456`
- **Quyền (Role)**: `admin`
