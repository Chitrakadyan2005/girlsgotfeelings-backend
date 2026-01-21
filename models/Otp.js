const pool = require('../config/db');
const { purge } = require('../routes/authRoutes');
const bcrypt = require('bcrypt');

const Otp = {
    create: async({ identifier, purpose, otp}) => {
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 5*60*1000);

        await pool.query(
            `INSERT INTO otps (identifier, purpose, otp,expires_at)
            VALUES ($1, $2, $3, $4)`,
            [identifier, purpose, hashedOtp, expiresAt]
        );
    },

    verify: async ({identifier, purpose, otp}) => {
        const {rows} = await pool.query(
            `SELECT * FROM otps
            WHERE identifier = $1
            AND purpose = $2
            AND used = false
            AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1`,
            [identifier, purpose]
        );

        if(!rows.length) throw new Error('Invalid or expired OTP');

        const isValid = await bcrypt.compare(otp, rows[0].otp);
        if (!isValid) throw new Error('Invalid or expired OTP');
        
        await pool.query(
            `UPDATE otps SET used = true WHERE id = $1`,
            [rows[0].id]
        );
    }
};


module.exports = Otp;