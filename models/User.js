const pool = require("../config/db");

const User = {
  delete: async (id) => {
    const { rowCount } = await pool.query(
      "DELETE FROM users WHERE id = $1",
      [id]
    );
    if (rowCount === 0) throw new Error("User not found");
  },

  findOrCreateByFirebase: async (firebaseUid, email) => {
    const byFirebase = await pool.query(
      `
      SELECT id, email, username, dm_permission, is_private
      FROM users WHERE firebase_uid = $1
      `,
      [firebaseUid]
    );

    if (byFirebase.rows.length) {
      return byFirebase.rows[0];
    }

    const byEmail = await pool.query(
      `SELECT id, firebase_uid FROM users WHERE email = $1`,
      [email]
    );

    if (byEmail.rows.length) {
      const user = byEmail.rows[0];

      if (!user.firebase_uid) {
        await pool.query(
          `UPDATE users SET firebase_uid = $1 WHERE id = $2`,
          [firebaseUid, user.id]
        );
      }

      return {
        id: user.id,
        email,
        username: null,
        dm_permission: "everyone",
        is_private: false,
      };
    }

    const { rows } = await pool.query(
      `
      INSERT INTO users (firebase_uid, email, dm_permission, is_private)
      VALUES ($1, $2, 'everyone', false)
      RETURNING id, email, username, dm_permission, is_private
      `,
      [firebaseUid, email]
    );

    return rows[0];
  },

  findByFirebaseUid: async (firebaseUid) => {
    const { rows } = await pool.query(
      `
      SELECT id, email, username, dm_permission, is_private
      FROM users WHERE firebase_uid = $1
      `,
      [firebaseUid]
    );
    return rows[0] || null;
  },
};

module.exports = User;