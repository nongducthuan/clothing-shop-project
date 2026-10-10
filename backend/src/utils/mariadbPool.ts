import 'dotenv/config';
import type { PrismaMariaDb } from '@prisma/adapter-mariadb';

/**
 * Cấu hình kết nối MariaDB dùng chung cho Prisma Client và seed.
 * ⚠️ KHÔNG đặt minimumIdle: 0 — mariadb 3.4.5 (bản @prisma/adapter-mariadb dùng riêng) chỉ mở
 * connection khi idleConnections.length < minimumIdle, nên 0 = pool không bao giờ mở connection
 * và mọi truy vấn trả P2039 "pool timeout (active=0 idle=0)".
 */
export type MariaDbConnectionConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

/** Kiểu cấu hình mà PrismaMariaDb nhận — lấy trực tiếp từ chữ ký của adapter. */
export type MariaDbPoolConfig = ConstructorParameters<typeof PrismaMariaDb>[0];

// Aiven dùng chứng chỉ không có trong CA store mặc định của Node nên cần bỏ verify.
export const MARIADB_SSL = { rejectUnauthorized: false } as const;

/** Tham số pool đã kiểm chứng thực tế với Aiven qua mạng public. */
export const MARIADB_POOL_OPTIONS = {
  connectionLimit: 5, // cũ là 10: giảm connection thường trú để không đụng giới hạn của Aiven
  minimumIdle: 1, // BẮT BUỘC >= 1 (xem ghi chú đầu file); 1 connection nóng, còn lại mở theo nhu cầu
  acquireTimeout: 30000, // mặc định 10s quá ngắn cho mạng public tới Aiven -> P2039 oan
  connectTimeout: 20000, // driver kẹp connectTimeout <= acquireTimeout nên phải nâng acquireTimeout trước
  idleTimeout: 240, // tự đóng connection nhàn rỗi (server wait_timeout = 28800s)
  keepAliveDelay: 10000, // giữ TCP sống để proxy/NAT không cắt ngầm connection nhàn rỗi
} as const;

const URL_RE = /^(?:mysql|mariadb):\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/([^?]+)/;

/** Đọc cấu hình từ DATABASE_URL (mysql:// hoặc mariadb://), fallback sang DB_HOST/... */
export function getDbConfig(): MariaDbConnectionConfig {
  const url = process.env.DATABASE_URL;
  if (url) {
    const match = url.match(URL_RE);
    if (match) {
      return {
        host: match[3],
        port: Number(match[4]),
        user: match[1],
        // Mật khẩu trong URL có thể bị percent-encode (Aiven sinh mật khẩu ngẫu nhiên).
        password: decodeURIComponent(match[2]),
        database: match[5],
      };
    }
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shopdb',
  };
}

/** Cấu hình đầy đủ để tạo PrismaMariaDb (dùng cho cả app và seed). */
export function getMariaDbPoolConfig(): MariaDbPoolConfig {
  return {
    ...getDbConfig(),
    ssl: { ...MARIADB_SSL },
    ...MARIADB_POOL_OPTIONS,
  };
}
