const pool = require('../config/db');

const User = {
  delete: async (id) => {
    const { rowCount } = await pool.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    if (rowCount === 0) throw new Error('User not found');
  },

  findOrCreateByFirebase: async (firebaseUid, email) => {
    // 1️⃣ Try finding by email
    const existingByEmail = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingByEmail.rows.length) {
      const user = existingByEmail.rows[0];

      // attach firebase uid if missing
      if (!user.firebase_uid) {
        await pool.query(
          "UPDATE users SET firebase_uid = $1 WHERE id = $2",
          [firebaseUid, user.id]
        );
      }

      return user;
    }

    // 2️⃣ Create new user WITHOUT username
    const { rows } = await pool.query(
      `
      INSERT INTO users (firebase_uid, email)
      VALUES ($1, $2)
      RETURNING id, anonymous_id, email, username
      `,
      [firebaseUid, email]
    );

    return rows[0];
  }
};

module.exports = User;
