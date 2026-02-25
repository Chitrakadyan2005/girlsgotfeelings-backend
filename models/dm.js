const pool = require("../config/db");

const Chat = {
  getConversationsList: async (userId) => {
    const { rows } = await pool.query(
      `
    SELECT DISTINCT ON (other_user.id)
      other_user.id,
      other_user.username,
      other_user.avatar_url AS avatar,
      m.message AS lastMessage,
      m.created_at AS time
    FROM messages m
    JOIN users other_user
      ON other_user.id =
        CASE
          WHEN m.sender_id = $1 THEN m.receiver_id
          ELSE m.sender_id
        END
    WHERE m.sender_id = $1 OR m.receiver_id = $1
    ORDER BY other_user.id, m.created_at DESC
    `,
      [userId],
    );

    return rows;
  },

  getChatWithUser: async (userId, otherUserId, limit = 50, offset = 0) => {
    const { rows } = await pool.query(
      `
    SELECT 
      m.sender_id,
      m.receiver_id,
      m.message,
      m.created_at,
      u.username AS from
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE 
      (m.sender_id = $1 AND m.receiver_id = $2)
      OR
      (m.sender_id = $2 AND m.receiver_id = $1)
    ORDER BY m.created_at DESC
    LIMIT $3 OFFSET $4
    `,
      [userId, otherUserId, limit, offset],
    );

    return rows.reverse();
  },

  sendMessage: async (senderId, receiverId, message) => {
    const { rows } = await pool.query(
      `
    INSERT INTO messages (sender_id, receiver_id, message)
    VALUES ($1, $2, TRIM($3))
    RETURNING id, sender_id, receiver_id, message, created_at
    `,
      [senderId, receiverId, message],
    );
    return rows[0];
  },
};

module.exports = Chat;
