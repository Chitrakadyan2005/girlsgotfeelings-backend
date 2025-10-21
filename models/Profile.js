const pool = require('../config/db');

const Profile = {
getUserProfileByUsername: async (username) => {
  const { rows } = await pool.query(
    `SELECT id, username, bio, avatar_url, to_char(created_at, 'DD Mon YYYY') as "joinDate"
     FROM users
     WHERE lower(username) = $1`,
    [username.toLowerCase()]
  );
  return rows[0];
},


getUserStatsById: async (userId) => {
  const { rows } = await pool.query(
    `SELECT 
       (SELECT COUNT(*) FROM posts WHERE user_id = $1) AS "postCount",
       (SELECT COUNT(*) FROM followers WHERE following_id = $1) AS "followerCount",
       (SELECT COUNT(*) FROM followers WHERE follower_id = $1) AS "followingCount"
     FROM users
     WHERE id = $1`,
    [userId]
  );
  return rows[0];
},





  getUserPostsByUsername: async (username) => {
  const { rows } = await pool.query(
    `SELECT
      p.id,
      p.content,
      to_char(p.created_at, 'DD Mon YYYY HH:MI AM') as "time",
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE lower(u.username) = $1
     ORDER BY p.created_at DESC
     LIMIT 10`,
    [username.toLowerCase()]
  );
  return rows;
},


  getUserStatsByUsername: async (username) => {
  const { rows } = await pool.query(
    `SELECT 
      (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as "postCount",
      (SELECT COUNT(*) FROM followers WHERE following_id = u.id) as "followerCount",
      (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) as "followingCount"
     FROM users u
     WHERE lower(username) = $1`,
    [username.toLowerCase()]
  );
  return rows[0];
},


  followUser: async (followerId, followingId) => {
  await pool.query(
    `INSERT INTO followers (follower_id, following_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [followerId, followingId]
  );
},

unfollowUser: async (followerId, followingId) => {
  await pool.query(
    `DELETE FROM followers WHERE follower_id = $1 AND following_id = $2`,
    [followerId, followingId]
  );
},


    isFollowing: async ( followedId, followingId) => {
      const { rows } = await pool.query(
        `SELECT 1 FROM followers WHERE follower_id = $1 AND following_id = $2`,
        [followedId, followingId]
      );
      return rows.length > 0;
    },

    updateAvatar: async (userId, avatarUrl) => {
    await pool.query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2`,
      [avatarUrl, userId]
    );
  },

  getFollowers: async (userId) => {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.avatar_url as "avatarUrl"
       FROM users u
       JOIN followers f ON u.id = f.follower_id
       WHERE f.following_id = $1`,
      [userId]
    );
    return rows;
  },

  getFollowing: async (userId) => {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.avatar_url as "avatarUrl"
       FROM users u
       JOIN followers f ON u.id = f.following_id
       WHERE f.follower_id = $1`,
      [userId]
    );
    return rows;
  }
};


module.exports = Profile;  