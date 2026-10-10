import fs from 'fs';
import path from 'path';

/** Chặn tái phát mojibake của prisma/seed.ts: các ký tự dưới đây không có trong tiếng Việt. */
const SEED_FILE = path.resolve(__dirname, '../../../prisma/seed.ts');
const MOJIBAKE_SIGNATURES = /áº|á»|Æ°|Ã[\u0080-\u00BF]|â€|âœ|[\u0080-\u009F]/;

describe('prisma/seed.ts – encoding tiếng Việt', () => {
  const seed = fs.readFileSync(SEED_FILE, 'utf8');

  it('không còn dấu hiệu double-encode', () => {
    expect(seed).not.toMatch(MOJIBAKE_SIGNATURES);
    expect(seed).not.toContain('\uFFFD');
  });

  it('giữ đúng nội dung tiếng Việt của dữ liệu mẫu', () => {
    expect(seed).toContain("console.log('Bắt đầu seed...')");
    expect(seed).toContain("name_vi: 'Áo Sơ Mi'");
    expect(seed).toContain("name: 'Nguyễn Văn A'");
    expect(seed).toContain("title_vi: 'Chào Mừng Đến Với LOOM'");
  });
});
