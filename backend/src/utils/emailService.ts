export const sendEmail = async (
  to: string,
  subject: string,
  text: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const otpMatch = text.match(/\d+/);
    const otp = otpMatch ? otpMatch[0] : 'N/A';

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
        subject: subject,
        htmlContent: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #7c3aed;">Mã xác thực đơn hàng</h2>
            <p>Chào bạn,</p>
            <p>Mã OTP của bạn là: <strong style="font-size: 24px; color: #7c3aed;">${otp}</strong></p>
            <p>Mã này sẽ hết hạn sau 5 phút.</p>
            <hr />
            <p style="font-size: 12px; color: #888;">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
          </div>
        `
      })
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    console.log('✅ Email sent successfully via Brevo:', data);
    return { success: true, data };
  } catch (err: any) {
    console.error('❌ Brevo Error:', err.message);
    return { success: false, error: err.message };
  }
};
