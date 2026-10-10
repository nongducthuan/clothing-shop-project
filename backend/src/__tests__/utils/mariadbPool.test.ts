import fs from 'fs';
import path from 'path';
import { MARIADB_POOL_OPTIONS, getDbConfig, getMariaDbPoolConfig } from '../../utils/mariadbPool';

/** Chặn tái phát P2039 "pool timeout (active=0 idle=0)" — chi tiết: src/utils/mariadbPool.ts. */
describe('src/utils/mariadbPool – cấu hình pool MariaDB', () => {
  const ENV_KEYS = ['DATABASE_URL', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] as const;
  const originalEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]])) as Record<string, string | undefined>;

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  describe('MARIADB_POOL_OPTIONS', () => {
    it('giữ minimumIdle >= 1 (nếu 0 thì pool không bao giờ mở connection)', () => {
      expect(MARIADB_POOL_OPTIONS.minimumIdle).toBeGreaterThanOrEqual(1);
    });

    it('không giữ nhiều connection thường trú hơn connectionLimit', () => {
      expect(MARIADB_POOL_OPTIONS.minimumIdle).toBeLessThanOrEqual(MARIADB_POOL_OPTIONS.connectionLimit);
      expect(MARIADB_POOL_OPTIONS.connectionLimit).toBeLessThanOrEqual(10);
    });

    it('acquireTimeout đủ dài cho mạng public tới Aiven và không nhỏ hơn connectTimeout', () => {
      // Mặc định 10s từng gây P2039 khi handshake chậm hơn 10s.
      expect(MARIADB_POOL_OPTIONS.acquireTimeout).toBeGreaterThanOrEqual(20000);
      // Driver kẹp connectTimeout xuống bằng acquireTimeout nếu lớn hơn.
      expect(MARIADB_POOL_OPTIONS.connectTimeout).toBeLessThanOrEqual(MARIADB_POOL_OPTIONS.acquireTimeout);
    });
  });

  describe('getDbConfig', () => {
    it('đọc được DATABASE_URL dạng mysql:// và giải mã mật khẩu percent-encode', () => {
      process.env.DATABASE_URL = 'mysql://avnadmin:p%40ss%2Fword@db.example.com:12345/shopdb?ssl-mode=REQUIRED';

      expect(getDbConfig()).toEqual({
        host: 'db.example.com',
        port: 12345,
        user: 'avnadmin',
        password: 'p@ss/word',
        database: 'shopdb',
      });
    });

    it('chấp nhận cả scheme mariadb://', () => {
      process.env.DATABASE_URL = 'mariadb://root:secret@localhost:3307/shopdb';

      expect(getDbConfig()).toMatchObject({ host: 'localhost', port: 3307, database: 'shopdb' });
    });

    it('fallback sang bộ biến DB_* khi không có DATABASE_URL', () => {
      delete process.env.DATABASE_URL;
      process.env.DB_HOST = '127.0.0.1';
      process.env.DB_PORT = '3308';
      process.env.DB_USER = 'tester';
      process.env.DB_PASSWORD = 'pw';
      process.env.DB_NAME = 'shopdb_test';

      expect(getDbConfig()).toEqual({
        host: '127.0.0.1',
        port: 3308,
        user: 'tester',
        password: 'pw',
        database: 'shopdb_test',
      });
    });
  });

  describe('getMariaDbPoolConfig', () => {
    it('gộp cấu hình kết nối, SSL và tham số pool', () => {
      process.env.DATABASE_URL = 'mysql://avnadmin:pw@db.example.com:12345/shopdb';
      const cfg = getMariaDbPoolConfig() as Record<string, unknown>;

      expect(cfg).toMatchObject({
        host: 'db.example.com',
        port: 12345,
        user: 'avnadmin',
        database: 'shopdb',
        ssl: { rejectUnauthorized: false },
        ...MARIADB_POOL_OPTIONS,
      });
    });
  });

  describe('hai nơi tạo PrismaMariaDb dùng chung cấu hình này', () => {
    const files = ['prisma/client.ts', 'prisma/seed.ts'].map((f) => ({
      file: f,
      // Bỏ comment trước khi soi code: trong comment có nhắc "KHÔNG đặt minimumIdle: 0".
      code: fs
        .readFileSync(path.resolve(__dirname, '../../../', f), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, ''),
      raw: fs.readFileSync(path.resolve(__dirname, '../../../', f), 'utf8'),
    }));

    it.each(files)('$file lấy cấu hình từ getMariaDbPoolConfig()', ({ raw }) => {
      expect(raw).toContain('getMariaDbPoolConfig');
    });

    it.each(files)('$file không tự khai báo minimumIdle (đặc biệt là 0)', ({ code }) => {
      expect(code).not.toMatch(/minimumIdle\s*:\s*0\b/);
      expect(code).not.toMatch(/minimumIdle\s*:/);
    });

    it.each(files)('$file không tự khai báo tham số pool (đã tập trung ở mariadbPool.ts)', ({ code }) => {
      expect(code).not.toMatch(/connectionLimit\s*:/);
    });
  });
});
