const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, text) => {
  try {
    // 1. Kiểm tra an toàn cho mã OTP để tránh lỗi regex [0]
    const otpMatch = text.match(/\d+/);
    const otp = otpMatch ? otpMatch[0] : "N/A";

    const { data, error } = await resend.emails.send({
      from: 'MyStore <onboarding@resend.dev>', 
      to: [to],
      subject: subject,
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

    if (error) {
      // 2. Chỉ log lỗi chứ KHÔNG throw error
      console.error("❌ Resend API Error (Có thể do mail chưa verify):", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ Email sent successfully:", data.id);
    return { success: true, data };

  } catch (err) {
    // 3. Catch lỗi hệ thống (mất mạng, sai API key...) và trả về object thay vì crash server
    console.error("❌ System Error in sendEmail:", err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendEmail };