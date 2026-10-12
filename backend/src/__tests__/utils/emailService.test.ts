import { sendEmail, sendOtpEmail } from '../../utils/emailService';

const fetchMock = jest.fn();
const originalFetch = global.fetch;
const originalKey = process.env.BREVO_API_KEY;

function sentPayload(): { subject: string; htmlContent: string; to: { email: string }[] } {
  return JSON.parse(fetchMock.mock.calls[0][1].body);
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.BREVO_API_KEY = 'test-brevo-key';
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ messageId: 'm-1' }) });
  global.fetch = fetchMock as unknown as typeof fetch;
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  global.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.BREVO_API_KEY;
  else process.env.BREVO_API_KEY = originalKey;
});

describe('sendEmail (email thông thường)', () => {
  it('gửi đúng tiêu đề và nội dung của nơi gọi, KHÔNG dùng mẫu OTP', async () => {
    const result = await sendEmail(
      'customer@example.com',
      'Order Confirmation',
      'Thank you! Order #777 has been placed successfully. Total: 125,001 VND',
      'en'
    );

    expect(result.success).toBe(true);
    const payload = sentPayload();
    expect(payload.subject).toBe('Order Confirmation');
    expect(payload.to).toEqual([{ email: 'customer@example.com' }]);
    expect(payload.htmlContent).toContain('Order #777 has been placed successfully');
    expect(payload.htmlContent).not.toContain('OTP');
  });

  it('escape HTML trong nội dung để không chèn được thẻ lạ', async () => {
    await sendEmail('a@b.com', 'Hi <b>', 'x <script>alert(1)</script>');

    const { htmlContent } = sentPayload();
    expect(htmlContent).not.toContain('<script>');
    expect(htmlContent).toContain('&lt;script&gt;');
    expect(htmlContent).toContain('Hi &lt;b&gt;');
  });

  it('trả về lỗi (không throw) khi thiếu BREVO_API_KEY', async () => {
    delete process.env.BREVO_API_KEY;

    const result = await sendEmail('a@b.com', 's', 't');

    expect(result.success).toBe(false);
    expect(result.error).toContain('BREVO_API_KEY');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('trả về message lỗi của Brevo khi API từ chối', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({ message: 'Invalid sender' }) });

    const result = await sendEmail('a@b.com', 's', 't');

    expect(result).toEqual({ success: false, error: 'Invalid sender' });
  });
});

describe('sendOtpEmail', () => {
  it('dùng mẫu OTP tiếng Việt và chèn đúng mã', async () => {
    await sendOtpEmail('customer@example.com', '482913', 'vi');

    const payload = sentPayload();
    expect(payload.subject).toBe('Mã xác thực đơn hàng');
    expect(payload.htmlContent).toContain('482913');
    expect(payload.htmlContent).toContain('hết hạn sau 5 phút');
  });

  it('dùng mẫu OTP tiếng Anh khi language = en', async () => {
    await sendOtpEmail('customer@example.com', '482913', 'en');

    const payload = sentPayload();
    expect(payload.subject).toBe('Order Verification Code');
    expect(payload.htmlContent).toContain('Your OTP code is');
  });
});
