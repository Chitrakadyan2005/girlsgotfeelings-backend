const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

exports.sendOtpMail = async (to, otp, purpose) => {
    const subject =
        purpose === 'register' ? 'Verify your account' : 'Reset your password';
    
    const text = `your OTP is ${otp}. It will expire in 5 minutes.`;

    await transporter.sendMail({
        from: `"HAVN|LIKE" <${process.env.MAIL_USER}>`,
        to,
        subject,
        text
    });
};