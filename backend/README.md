# Backend — Clothing Shop

## Yêu cầu

- Node.js 22+ và npm.
- PostgreSQL 14+ (local hoặc managed database).

## Cài đặt

Tạo database PostgreSQL trước (ví dụ local), sau đó cấu hình `.env` trước khi cài dependencies vì Prisma 7 đọc `DATABASE_URL` khi generate client:

```bash
createdb shopdb
cp .env.example .env
```

Sửa `DATABASE_URL` trong `.env` thành thông tin kết nối thực tế:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/shopdb?schema=public"
```

Cài dependencies:

```bash
npm install --legacy-peer-deps
```

Lockfile backend của bản MySQL cũ không được giữ lại vì chứa driver cũ; lần cài đầu sẽ tạo `package-lock.json` mới cho bộ dependency PostgreSQL.

Nếu dùng dịch vụ PostgreSQL yêu cầu SSL, dùng URL do nhà cung cấp cấp (thường có `?sslmode=require`). Không thêm tham số SSL nếu nhà cung cấp không yêu cầu.

## Đồng bộ schema và seed dữ liệu

```bash
npx prisma generate
npx prisma db push
npm run seed
```

> **Cảnh báo:** `npm run seed` xoá dữ liệu hiện có trong các bảng ứng dụng trước khi tạo dữ liệu mẫu, bao gồm người dùng, sản phẩm, đơn hàng và khuyến mãi. Chỉ chạy trên database mới hoặc khi chủ động muốn reset dữ liệu. Seed sử dụng PostgreSQL advisory lock để ngăn hai tiến trình seed chạy đồng thời, và đồng bộ lại identity sequences sau khi tạo các bản ghi có ID chỉ định.

> **Chuyển dữ liệu từ MySQL:** Việc chuyển đổi source code và schema không tự sao chép dữ liệu đang có trong MySQL. Nếu cần giữ dữ liệu thật, hãy sao lưu/export MySQL và chuyển dữ liệu sang PostgreSQL riêng trước khi chạy ứng dụng. Không chạy `npm run seed` trên database đã có dữ liệu cần giữ.

Có thể dùng các script SQL trong `database/` thay cho seed TypeScript nếu cần: chạy `schema.sql` khi đã kết nối vào database `shopdb`, sau đó `seed_data.sql` và `views_indexes.sql`. Prisma schema (`prisma/schema.prisma`) vẫn là nguồn sự thật; `npx prisma db push` là cách khuyến nghị để tạo cấu trúc bảng.

## Chạy backend

```bash
npm run dev
```

Backend mặc định lắng nghe tại `http://localhost:5000`.

## Kiểm tra

```bash
npm test
npm run typecheck
npm run check:no-any
```

## Biến môi trường

Ngoài `DATABASE_URL`, cấu hình các biến tích hợp theo `.env.example`: JWT, frontend/backend URL, Brevo, MoMo, VNPay và Google Gemini.
