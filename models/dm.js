const pool = require('../config/db');

const Chat = {
    getConversationsList: async (userId) => {
        const {rows} = await pool.query(
            `SELECT DISTINCT ON (u.id) 
                u.id, 
                u.username, 
                u.avatar_url as avatar,
                m.message as lastMessage,
                m.created_at as time
            FROM users u
            JOIN messages m 
                ON (u.id = m.sender_id AND m.receiver_id = $1)
                OR (u.id = m.receiver_id AND m.sender_id = $1)
            WHERE u.id != $1
            ORDER BY u.id, m.created_at DESC`,
            [userId]
        );
        return rows;
    },

    getChatWithUser: async(userId, otherUserId) => {
        const {rows} = await pool.query(
            `SELECT m.sender_id, m.receiver_id, m.message, m.created_at,
                    u.username as from
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE (m.sender_id = $1 AND m.receiver_id = $2)
                OR(m.sender_id = $2 AND m.receiver_id = $1)
            ORDER BY m.created_at`,
            [userId, otherUserId]
        );
        return rows;
    },

    sendMessage: async (senderId, receiverId, message) => {
    const { rows } = await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, message)
         VALUES ($1, $2, $3)
         RETURNING id, sender_id, receiver_id, message, created_at`,
        [senderId, receiverId, message]
    );
    return rows[0]; // inserted message
}

};

module.exports = Chat;
