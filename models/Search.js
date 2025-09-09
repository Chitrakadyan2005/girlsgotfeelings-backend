const pool = require('../config/db');

const Search = {
    searchPosts: async (query) => {
        const { rows } = await pool.query(
            `SELECT posts.id, 
                    posts.content, 
                    to_char(posts.created_at, 'DD Mon YYYY HH:MI AM') AS timestamp,
                    users.username,
                    users.avatar_url
             FROM posts
             JOIN users ON posts.user_id = users.id
             WHERE posts.content ILIKE $1 OR users.username ILIKE $1
             ORDER BY posts.created_at DESC
             LIMIT 10`,
            [`%${query}%`]
        );
        return rows;
    },

    searchUsers: async (query) => {
        const { rows } = await pool.query(
            `SELECT id, username, anonymous_id, avatar_url, bio,
       to_char(created_at, 'DD Mon YYYY') AS join_date
FROM users
WHERE username ILIKE $1
LIMIT 5
`,
            [`%${query}%`]
        );
        return rows;
    }
};


module.exports = Search;
