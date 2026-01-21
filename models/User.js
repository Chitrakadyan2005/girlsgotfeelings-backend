const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = {
  create: async (username, email, userProvidedPhrase) => {
  const exists = await pool.query(
    'SELECT * FROM users WHERE username = $1 OR email = $2',
    [username, email]
  );
  if (exists.rows.length) throw new Error('User already exists');

  const secret_phrase_hash = await bcrypt.hash(userProvidedPhrase, 10);

  const { rows } = await pool.query(
    `INSERT INTO users (username, email, secret_phrase_hash)
     VALUES ($1, $2, $3)
     RETURNING id, anonymous_id, username`,
    [username, email, secret_phrase_hash]
  );

    
    return {
  token: jwt.sign(
    {
      id: rows[0].id,
      anonymous_id: rows[0].anonymous_id,
      username: rows[0].username // ✅ yahan add karo
    },
    process.env.JWT_SECRET,
    { expiresIn: '90d' }
  ),
  username: rows[0].username
};

  },

  login: async (username, secret_phrase) => {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (!rows.length) throw new Error('User not found');
    
    const isValid = await bcrypt.compare(secret_phrase, rows[0].secret_phrase_hash);
    if (!isValid) throw new Error('Invalid secret phrase');
    
    return {
  token: jwt.sign(
    {
      id: rows[0].id,
      anonymous_id: rows[0].anonymous_id,
      username: rows[0].username
    },
    process.env.JWT_SECRET,
    { expiresIn: '90d' }
  ),
  username: rows[0].username
};

  },
  
  updatePassword: async(username, newPassword) => {
     username = username.trim().toLowerCase();

    const secret_phrase_hash = await bcrypt.hash(newPassword, 10);

    const{ rowCount } = await pool.query(
      'UPDATE users SET secret_phrase_hash = $1 WHERE username = $2',
      [secret_phrase_hash, username]
    );
    if(rowCount === 0) throw new Error('user not found');
  },
  
  delete: async(id) => {
    const { rowCount } = await pool.query(
      'DELETE FROM users WHERE id = $1',[id]
    );
    if(rowCount === 0) throw new Error('User not found');
  }
};

module.exports = User;
