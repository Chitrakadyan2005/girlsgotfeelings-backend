const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false } // Required for Neon
});
module.exports = pool;