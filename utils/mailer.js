const axios = require("axios");

exports.sendOtpMail = async (to, otp, purpose) => {
  const subject =
    purpose === "register"
      ? "Verify your HAVN|LIKE account"
      : "Reset your HAVN|LIKE password";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif">
      <h2>🔐 Your OTP Code</h2>
      <p>Your OTP is:</p>
      <h1 style="letter-spacing:4px">${otp}</h1>
      <p>This code expires in <b>5 minutes</b>.</p>
      <br/>
      <p>💗 Team HAVN|LIKE</p>
    </div>
  `;

  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "HAVN|LIKE 💗",
          email: "no-reply@havnlike.app",
        },
        to: [{ email: to }],
        subject,
        htmlContent,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ OTP email sent to:", to);
  } catch (err) {
    console.error(
      "❌ Failed to send OTP email:",
      err.response?.data || err.message
    );
    throw new Error("Failed to send OTP email");
  }
};
