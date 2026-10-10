# Clothing Shop — Backend (Express + Prisma + TypeScript)

REST API, thanh toán (MoMo / VNPay), Socket.IO và chatbot AI của đồ án **Clothing Shop**.

Đây là phần backend trong monorepo. Tài liệu đầy đủ (kiến trúc, danh sách API, tài khoản mặc định, thẻ sandbox MoMo/VNPay...) nằm ở **[README gốc của dự án](../README.md)**.

---

## Yêu cầu

- Node.js 22 trở lên (repo được kiểm thử với Node 24).
- MySQL/MariaDB (ví dụ Aiven, hoặc cài local).

## Cài đặt & chạy

```bash
npm install                # tự chạy prisma generate
cp .env.example .env       # Windows CMD/PowerShell: copy .env.example .env
npx prisma db push         # tạo bảng theo prisma/schema.prisma
npm run seed               # nạp dữ liệu mẫu (XOÁ SẠCH dữ liệu cũ)
npm run dev                # http://localhost:5000
```

> `npm run seed` reset toàn bộ dữ liệu. Chỉ chạy khi mới thiết lập hoặc muốn xoá sạch. Có thể nạp bằng SQL thay thế: `database/schema.sql`, `database/seed_data.sql`, `database/views_indexes.sql`.

## Scripts

| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` | Chạy dev, tự reload (`tsx watch`) |
| `npm start` | Chạy production (`tsx src/index.ts`) |
| `npm run seed` | Reset và nạp dữ liệu mẫu |
| `npm test` | Chạy Jest (mock hoàn toàn, không cần DB) |
| `npm run test:coverage` | Jest kèm báo cáo coverage |
| `npm run typecheck` | Kiểm tra kiểu TypeScript (`tsc --noEmit`) |
| `npm run check:no-any` | Chặn việc dùng `any` |

## Biến môi trường (`backend/.env`)

Mẫu đầy đủ nằm trong `.env.example`; mô tả chi tiết từng biến ở README gốc. Nhóm chính:

- **CSDL & server**: `DATABASE_URL`, `PORT`, `BACKEND_URL`, `FRONTEND_URL` (CORS)
- **Xác thực**: `JWT_SECRET`, `JWT_REFRESH_SECRET`
- **Thanh toán**: `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `VNP_TMNCODE`, `VNP_HASHSECRET`, `VNP_URL`, `VNP_RETURNURL`
- **Email & AI**: `BREVO_API_KEY`, `EMAIL_USER`, `GOOGLE_API_KEY`

> Khi deploy, `VNP_RETURNURL`, `BACKEND_URL` và `FRONTEND_URL` phải trỏ đúng domain thật, không phải `localhost`.
