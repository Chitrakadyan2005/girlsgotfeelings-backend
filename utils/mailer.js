const nodemailer = require("nodemailer");

console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS exists:", !!process.env.SMTP_PASS);

// Brevo / Sendinblue SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // MUST be false for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Optional but very helpful
transporter.verify((err) => {
  if (err) {
    console.error("❌ SMTP connection failed:", err.message);
  } else {
    console.log("✅ SMTP server ready to send emails");
  }
});

exports.sendOtpMail = async (to, otp, purpose) => {
  const subject =
    purpose === "register"
      ? "Verify your HAVN|LIKE account"
      : "Reset your HAVN|LIKE password";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6">
      <h2>🔐 Your OTP Code</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 4px">${otp}</h1>
      <p>This code will expire in <b>5 minutes</b>.</p>
      <p>If you didn’t request this, you can safely ignore this email.</p>
      <br/>
      <p>💗 Team HAVN|LIKE</p>
    </div>
  `;

  await transporter.sendMail({
    from: '"HAVN|LIKE 💗" <no-reply@havnlike.app>',
    to,
    subject,
    html,
  });
};
