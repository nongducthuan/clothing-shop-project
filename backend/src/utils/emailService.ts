export interface BrevoEmailResponse {
  message?: string;
  messageId?: string;
  [key: string]: unknown;
}

type EmailResult = { success: boolean; data?: BrevoEmailResponse; error?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Gửi 1 email qua Brevo — dùng chung cho email thường và email OTP. */
async function postToBrevo(to: string, subject: string, htmlContent: string): Promise<EmailResult> {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.EMAIL_USER; // Email của bạn đã verify trên Brevo

    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not defined in environment variables");
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: "MyStore",
          email: senderEmail || "ducthuan081004@gmail.com"
        },
        to: [
          {
            email: to
          }
        ],
        subject,
        htmlContent
      })
    });

    const rawData: unknown = await response.json();
    const data: BrevoEmailResponse = isRecord(rawData) ? rawData : {};

    if (!response.ok) {
      throw new Error(
        typeof data.message === 'string'
          ? data.message
          : `HTTP error! status: ${response.status}`
      );
    }

    if (process.env.NODE_ENV !== 'production') console.log('✅ Email sent successfully via Brevo:', data);
    return { success: true, data };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown email error';
    console.error('❌ Brevo Error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Email thông báo thông thường (xác nhận đơn, hủy đơn tự động...).
 * Dùng đúng `subject` và nội dung `text` do nơi gọi truyền vào.
 */
export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  language: string = 'vi'
): Promise<EmailResult> => {
  const htmlContent = `
          <div lang="${escapeHtml(language)}" style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #7c3aed;">${escapeHtml(subject)}</h2>
            <p>${escapeHtml(text).replace(/\n/g, '<br />')}</p>
          </div>
        `;
  return postToBrevo(to, subject, htmlContent);
};

/** Email mã OTP xác thực tra cứu đơn hàng (mẫu riêng, hết hạn sau 5 phút). */
export const sendOtpEmail = async (
  to: string,
  otp: string,
  language: string = 'vi'
): Promise<EmailResult> => {
  const isEnglish = language === 'en';
  const subject = isEnglish ? "Order Verification Code" : "Mã xác thực đơn hàng";
  const safeOtp = escapeHtml(otp);

  const htmlContent = isEnglish
    ? `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #7c3aed;">Order Verification Code</h2>
            <p>Hello,</p>
            <p>Your OTP code is: <strong style="font-size: 24px; color: #7c3aed;">${safeOtp}</strong></p>
            <p>This code will expire in 5 minutes.</p>
            <hr />
            <p style="font-size: 12px; color: #888;">If you did not request this, please ignore this email.</p>
          </div>
        `
    : `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #7c3aed;">Mã xác thực đơn hàng</h2>
            <p>Chào bạn,</p>
            <p>Mã OTP của bạn là: <strong style="font-size: 24px; color: #7c3aed;">${safeOtp}</strong></p>
            <p>Mã này sẽ hết hạn sau 5 phút.</p>
            <hr />
            <p style="font-size: 12px; color: #888;">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
          </div>
        `;

  return postToBrevo(to, subject, htmlContent);
};
