const axios = require("axios");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.MAIL_FROM;

exports.sendOtpMail = async (to, otp, purpose) => {
  if (!BREVO_API_KEY || !FROM_EMAIL) {
    throw new Error("Brevo env vars missing");
  }

  const subject =
    purpose === "register"
      ? "Verify your HAVNLIKE account"
      : "Reset your HAVNLIKE password";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 16px;">
      <h2>${subject}</h2>
      <p>Your OTP is:</p>
      <h1 style="letter-spacing: 4px;">${otp}</h1>
      <p>This OTP will expire in 5 minutes.</p>
      <p>If you didn’t request this, you can ignore this email.</p>
    </div>
  `;

  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          email: FROM_EMAIL,  
          name: "HAVNLIKE",
        },
        to: [{ email: to }],
        subject,
        htmlContent,
      },
      {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("📩 OTP email sent to:", to);
  } catch (err) {
    console.error(
      "❌ Brevo email error:",
      err.response?.data || err.message
    );
    throw new Error("Failed to send OTP email");
  }
};
