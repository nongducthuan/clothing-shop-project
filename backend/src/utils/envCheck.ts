/**
 * Kiểm tra các biến sống còn lúc server khởi động. Vì sao: thiếu env trên host deploy
 * (Render/VPS) không làm server chết, nó chỉ làm vài API trả 500 "Server error" —
 * rất dễ chẩn đoán sai (VD thiếu JWT_SECRET: register vẫn 201 nhưng login luôn 500
 * tại jwt.sign()). `.env.example` không ngăn được việc quên khai báo trên host.
 */
import 'dotenv/config';

/**
 * Chỉ liệt kê những biến mà khi thiếu sẽ gây LỖI KHÓ CHẨN ĐOÁN (fail lặng lẽ: 500 ở
 * vài API, hoặc callback trỏ về localhost). Biến nào thiếu mà server báo lỗi ngay thì
 * không cần.
 */
export const CRITICAL_ENV = [
  { name: 'DATABASE_URL', effect: 'mọi truy vấn Prisma lỗi 500 (mọi API đọc/ghi DB)' },
  { name: 'JWT_SECRET', effect: 'POST /api/auth/login và mọi API cần access token lỗi 500' },
  {
    name: 'JWT_REFRESH_SECRET',
    effect: 'POST /api/auth/login và /api/auth/refresh lỗi 500 (register vẫn chạy → rất dễ chẩn đoán sai)',
  },
  {
    name: 'FRONTEND_URL',
    effect:
      'CORS trong src/index.ts không có fallback → frontend trên domain thật bị chặn mọi request; ' +
      'đồng thời Socket.io và redirect MoMo trỏ sai về localhost:5173',
  },
  {
    name: 'BACKEND_URL',
    effect:
      'URL callback MoMo/VNPay trỏ về localhost:5000 → thanh toán không bao giờ được xác nhận ' +
      '(IPN không tới server), đơn treo ở trạng thái chờ thanh toán',
  },
] as const;


/** Trả về tên các biến còn thiếu (undefined hoặc chỉ có khoảng trắng). */
export function getMissingCriticalEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  return CRITICAL_ENV.filter((item) => !env[item.name]?.trim()).map((item) => item.name);
}

export function warnMissingCriticalEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  const missing = getMissingCriticalEnv(env);
  if (missing.length === 0) return missing;

  // Chỉ log, KHÔNG throw (server vẫn lên để các API không phụ thuộc biến thiếu dùng được).
  console.error(`\n❌ THIẾU BIẾN MÔI TRƯỜNG BẮT BUỘC: ${missing.join(', ')}`);
  for (const item of CRITICAL_ENV) {
    if (missing.includes(item.name)) console.error(`   - ${item.name} → ${item.effect}`);
  }
  console.error('   → Khai báo trong backend/.env (local) hoặc Environment Variables của host deploy, rồi khởi động lại server.\n');
  return missing;
}

export interface RequiredEnvCheckResult {
  /** Danh sách biến còn thiếu (rỗng nếu cấu hình đầy đủ). */
  missing: string[];
  /** True khi STRICT_ENV_CHECK=true. */
  strict: boolean;
}

/**
 * Chặn deploy hẳn (fail-fast) — CHỈ khi bật STRICT_ENV_CHECK=true.
 *
 * Mặc định (flag tắt/không có): chỉ log cảnh báo qua `warnMissingCriticalEnv`,
 * server vẫn khởi động bình thường.
 * Bật flag trên host deploy: thiếu biến nào → ném lỗi ngay khi khởi động để
 * deploy crash loop thay vì chạy nửa vời (vài API 500, callback thanh toán treo).
 */
export function checkCriticalEnv(env: NodeJS.ProcessEnv = process.env): RequiredEnvCheckResult {
  const missing = warnMissingCriticalEnv(env);
  const strict = String(env.STRICT_ENV_CHECK ?? '')
    .trim()
    .toLowerCase() === 'true';
  if (strict && missing.length > 0) {
    throw new Error(
      `[env] Missing required environment variables: ${missing.join(', ')} (STRICT_ENV_CHECK=true)`
    );
  }
  return { missing, strict };
}
