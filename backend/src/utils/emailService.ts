import nodemailer from 'nodemailer';

// Singleton transporter — tạo 1 lần, dùng lại cho mọi request
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // TLS (STARTTLS) — dùng true nếu port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (không phải mật khẩu thường)
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  text: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // Lấy mã OTP từ nội dung text nếu có
    const otpMatch = text.match(/\d+/);
    const otp = otpMatch ? otpMatch[0] : 'N/A';

    const info = await transporter.sendMail({
      from: `"MyStore" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #7c3aed;">Mã xác thực đơn hàng</h2>
          <p>Chào bạn,</p>
          <p>Mã OTP của bạn là: <strong style="font-size: 24px; color: #7c3aed;">${otp}</strong></p>
          <p>Mã này sẽ hết hạn sau 5 phút.</p>
          <hr />
          <p style="font-size: 12px; color: #888;">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
        </div>
      `,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, data: { id: info.messageId } };
  } catch (err: any) {
    console.error('❌ Nodemailer Error:', err.message);
    return { success: false, error: err.message };
  }
};
