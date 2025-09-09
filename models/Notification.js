const pool = require('../config/db');

const Notification = {
    create: async(userId,fromUserId, type , message) => {
        await pool.query(
            `INSERT INTO notifications (user_id, from_user_id, type, message)
            VALUES ($1, $2, $3, $4)`,
            [userId,fromUserId, type, message]
        );
    },

    getForUser: async(userId) => {
        const {rows} = await pool.query(
            `SELECT 
            n.id,
            n.type,
            n.message,
            n.created_at,
            u.username AS from_username
            FROM notifications n
            JOIN users u ON n.from_user_id = u.id
            WHERE n.user_id = $1
            ORDER BY n.created_at DESC`,
            [userId]
        );
        return rows;
    }
};

module.exports = Notification;