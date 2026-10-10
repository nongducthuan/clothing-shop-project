import fs from 'fs';
import path from 'path';
import {
  CRITICAL_ENV,
  checkCriticalEnv,
  getMissingCriticalEnv,
  warnMissingCriticalEnv,
} from '../../utils/envCheck';

/**
 * Chặn tái phát lỗi "login 500 nhưng register vẫn chạy": nguyên nhân là thiếu JWT_SECRET
 * trên host deploy -> jwt.sign() ném lỗi -> catch trả 500 "Server error".
 * Các test dưới đây đảm bảo server cảnh báo được đúng biến còn thiếu ngay lúc khởi động.
 */
describe('src/utils/envCheck – biến môi trường bắt buộc', () => {
  const envOf = (values: Record<string, string | undefined>): NodeJS.ProcessEnv =>
    values as NodeJS.ProcessEnv;

  /**
   * Env "đầy đủ" dựng từ chính CRITICAL_ENV → test không vỡ khi sau này thêm biến mới.
   * Truyền `overrides` để mô phỏng biến bị thiếu/rỗng.
   */
  const fullEnv = (overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv => {
    const base: Record<string, string> = {};
    for (const item of CRITICAL_ENV) base[item.name] = `value-for-${item.name}`;
    return envOf({ ...base, ...overrides });
  };

  describe('CRITICAL_ENV', () => {
    it('bao gồm các biến làm API lỗi âm thầm: DB, JWT, refresh token, URL deploy', () => {
      const names = CRITICAL_ENV.map((item) => item.name);
      expect(names).toEqual(
        expect.arrayContaining([
          'DATABASE_URL',
          'JWT_SECRET',
          'JWT_REFRESH_SECRET',
          'FRONTEND_URL',
          'BACKEND_URL',
        ])
      );
    });

    it('mỗi biến đều mô tả hậu quả khi thiếu', () => {
      for (const item of CRITICAL_ENV) {
        expect(item.effect.trim().length).toBeGreaterThan(0);
      }
    });

    it('không có biến nào trùng tên', () => {
      const names = CRITICAL_ENV.map((item) => item.name);
      expect(new Set(names).size).toBe(names.length);
    });

    /**
     * Guard chống drift: nếu ai đó thêm biến vào CRITICAL_ENV mà code không hề dùng,
     * server sẽ cảnh báo sai (false alarm) ở mọi lần deploy → mất niềm tin vào log.
     */
    it('mọi biến trong CRITICAL_ENV đều THỰC SỰ được code đọc qua process.env.<TÊN>', () => {
      const srcDir = path.resolve(__dirname, '../../');
      const sources: string[] = [];
      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === '__tests__') continue;
            walk(full);
          } else if (entry.name.endsWith('.ts')) {
            sources.push(fs.readFileSync(full, 'utf8'));
          }
        }
      };
      walk(srcDir);
      const code = sources.join('\n');

      const unused = CRITICAL_ENV.map((item) => item.name).filter(
        (name) => !code.includes(`process.env.${name}`)
      );
      expect(unused).toEqual([]);
    });
  });

  describe('getMissingCriticalEnv', () => {
    it('trả về rỗng khi mọi biến đều có giá trị', () => {
      expect(getMissingCriticalEnv(fullEnv())).toEqual([]);
    });

    it('liệt kê biến chưa khai báo theo đúng thứ tự CRITICAL_ENV', () => {
      const env = fullEnv({ JWT_SECRET: undefined, JWT_REFRESH_SECRET: undefined });

      expect(getMissingCriticalEnv(env)).toEqual(['JWT_SECRET', 'JWT_REFRESH_SECRET']);
    });

    it('coi giá trị rỗng / chỉ khoảng trắng là thiếu', () => {
      const env = fullEnv({ DATABASE_URL: '   ', JWT_SECRET: '' });

      expect(getMissingCriticalEnv(env)).toEqual(['DATABASE_URL', 'JWT_SECRET']);
    });

    it('báo đúng FRONTEND_URL và BACKEND_URL khi thiếu (lỗi CORS / callback thanh toán)', () => {
      const env = fullEnv({ FRONTEND_URL: undefined, BACKEND_URL: '   ' });

      expect(getMissingCriticalEnv(env)).toEqual(['FRONTEND_URL', 'BACKEND_URL']);
    });
  });

  describe('warnMissingCriticalEnv', () => {
    afterEach(() => jest.restoreAllMocks());

    it('im lặng và trả về rỗng khi cấu hình đầy đủ', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(warnMissingCriticalEnv(fullEnv())).toEqual([]);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('in tên biến thiếu + hậu quả cụ thể (nhắc tới /api/auth/login) khi thiếu JWT_SECRET', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const env = fullEnv({ JWT_SECRET: undefined });

      expect(warnMissingCriticalEnv(env)).toEqual(['JWT_SECRET']);

      const logged = errorSpy.mock.calls.map((call) => String(call[0])).join('\n');
      expect(logged).toContain('THIẾU BIẾN MÔI TRƯỜNG BẮT BUỘC: JWT_SECRET');
      expect(logged).toContain('/api/auth/login');
    });

    it('báo được đúng lỗi JWT_REFRESH_SECRET (đã từng gây 500 khi login trên Render)', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const env = fullEnv({ JWT_REFRESH_SECRET: undefined });

      expect(warnMissingCriticalEnv(env)).toEqual(['JWT_REFRESH_SECRET']);

      const logged = errorSpy.mock.calls.map((call) => String(call[0])).join('\n');
      expect(logged).toContain('THIẾU BIẾN MÔI TRƯỜNG BẮT BUỘC: JWT_REFRESH_SECRET');
      expect(logged).toContain('JWT_REFRESH_SECRET →');
    });
  });

  describe('checkCriticalEnv (production / STRICT_ENV_CHECK)', () => {
    afterEach(() => jest.restoreAllMocks());

    it('mặc định KHÔNG chặn khởi động khi thiếu biến (chỉ cảnh báo), strict=false', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const env = fullEnv({ JWT_REFRESH_SECRET: undefined });

      expect(checkCriticalEnv(env)).toEqual({ missing: ['JWT_REFRESH_SECRET'], strict: false });
      expect(errorSpy).toHaveBeenCalled();
    });

    it('mặc định KHÔNG chặn khi flag vắng mặt, rỗng, hoặc khác "true"', () => {
      for (const flag of [undefined, '', 'false', '0', 'yes', '1', ' truex']) {
        const overrides: Record<string, string | undefined> = {
          JWT_REFRESH_SECRET: undefined,
        };
        if (flag !== undefined) overrides.STRICT_ENV_CHECK = flag;
        const env = fullEnv(overrides);

        expect(checkCriticalEnv(env)).toEqual({ missing: ['JWT_REFRESH_SECRET'], strict: false });
      }
    });

    it('chỉ chấp nhận đúng "true" (không phân biệt hoa/thường, bỏ khoảng trắng)', () => {
      for (const flag of ['true', 'TRUE', ' True ', 'TRUE ']) {
        const env = fullEnv({ JWT_REFRESH_SECRET: undefined, STRICT_ENV_CHECK: flag });
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => checkCriticalEnv(env)).toThrow(
          '[env] Missing required environment variables: JWT_REFRESH_SECRET (production requires complete configuration)'
        );
        // Vẫn log cảnh báo trước khi ném lỗi để log khởi động nêu rõ nguyên nhân.
        expect(errorSpy).toHaveBeenCalled();
      }
    });

    it('STRICT_ENV_CHECK=true nhưng cấu hình đầy đủ → khởi động bình thường', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const env = fullEnv({ STRICT_ENV_CHECK: 'true' });

      expect(checkCriticalEnv(env)).toEqual({ missing: [], strict: true });
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});
