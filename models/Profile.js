const pool = require("../config/db");

const Profile = {
  getUserById: async (userId) => {
    const { rows } = await pool.query(
      `SELECT 
        id, 
        username, 
        avatar_url, 
        is_private AS "isPrivate"
      FROM users 
      WHERE id = $1`,
      [userId],
    );
    return rows[0];
  },

  getUserByFirebaseUid: async (firebaseUid) => {
    const { rows } = await pool.query(
      `SELECT id, username FROM users WHERE firebase_uid = $1`,
      [firebaseUid],
    );
    return rows[0];
  },

  updateProfile: async (userId, username, bio) => {
    const { rows } = await pool.query(
      `UPDATE users
     SET username = $1, bio = $2
     WHERE id = $3
     RETURNING id, username, bio, avatar_url`,
      [username, bio || "", userId],
    );

    return {
      id: rows[0].id,
      username: rows[0].username,
      bio: rows[0].bio,
      avatarUrl: rows[0].avatar_url,
    };
  },

  getLikedPosts: async (userId) => {
    const { rows } = await pool.query(
      `SELECT p.id, p.content, u.username
     FROM likes l
     JOIN posts p ON p.id = l.post_id
     JOIN users u ON u.id = p.user_id
     WHERE l.user_id = $1
     ORDER BY l.created_at DESC`,
      [userId],
    );
    return rows;
  },

  getCommentedPosts: async (userId) => {
    const { rows } = await pool.query(
      `SELECT DISTINCT p.id, p.content, u.username
     FROM comments c
     JOIN posts p ON p.id = c.post_id
     JOIN users u ON u.id = p.user_id
     WHERE c.user_id = $1
     ORDER BY p.created_at DESC`,
      [userId],
    );
    return rows;
  },

  getUserProfileByUsername: async (username) => {
    const { rows } = await pool.query(
      `SELECT id, username, bio, avatar_url, to_char(created_at, 'DD Mon YYYY') as "joinDate"
     FROM users
     WHERE lower(username) = $1`,
      [username.toLowerCase()],
    );
    return rows[0];
  },

  getUserStatsById: async (userId) => {
    const { rows } = await pool.query(
      `
    SELECT 
      (SELECT COUNT(*) FROM posts WHERE user_id = $1) AS "postCount",
      (SELECT COUNT(*) FROM followers 
        WHERE following_id = $1 AND status = 'accepted') AS "followerCount",
      (SELECT COUNT(*) FROM followers 
        WHERE follower_id = $1 AND status = 'accepted') AS "followingCount"
    `,
      [userId],
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
      [username.toLowerCase()],
    );
    return rows;
  },

  getUserStatsByUsername: async (username) => {
    const { rows } = await pool.query(
      `SELECT 
      (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as "postCount",
      (SELECT COUNT(*) FROM followers WHERE following_id = u.id AND status = 'accepted') as "followerCount",
      (SELECT COUNT(*) FROM followers WHERE follower_id = u.id) as "followingCount"
     FROM users u
     WHERE lower(username) = $1`,
      [username.toLowerCase()],
    );
    return rows[0];
  },

  followUser: async (followerId, followingId, status = "accepted") => {
    await pool.query(
      `
    INSERT INTO followers (follower_id, following_id, status)
    VALUES ($1, $2, $3)
    ON CONFLICT (follower_id, following_id)
    DO UPDATE SET status = EXCLUDED.status
    WHERE followers.status = 'pending'
    `,
      [followerId, followingId, status],
    );
  },

  unfollowUser: async (followerId, followingId) => {
    await pool.query(
      `DELETE FROM followers WHERE follower_id = $1 AND following_id = $2`,
      [followerId, followingId],
    );
  },

  isFollowing: async (followerId, followingId) => {
    const { rows } = await pool.query(
      `
    SELECT 1 FROM followers
    WHERE follower_id = $1
      AND following_id = $2
      AND status = 'accepted'
    `,
      [followerId, followingId],
    );
    return rows.length > 0;
  },

  getFollowStatus: async (followerId, followingId) => {
    const { rows } = await pool.query(
      `
    SELECT status FROM followers
    WHERE follower_id = $1
      AND following_id = $2
    `,
      [followerId, followingId],
    );
    if (rows.length === 0) {
      return { isFollowing: false, isPending: false };
    }
    return {
      isFollowing: rows[0].status === "accepted",
      isPending: rows[0].status === "pending",
    };
  },

  updateAvatar: async (userId, avatarUrl) => {
    await pool.query(`UPDATE users SET avatar_url = $1 WHERE id = $2`, [
      avatarUrl,
      userId,
    ]);
  },

  getFollowers: async (userId) => {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.avatar_url as "avatarUrl"
       FROM users u
       JOIN followers f ON u.id = f.follower_id
       WHERE f.following_id = $1 AND f.status = 'accepted'`,
      [userId],
    );
    return rows;
  },

  getFollowing: async (userId) => {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.avatar_url as "avatarUrl"
       FROM users u
       JOIN followers f ON u.id = f.following_id
       WHERE f.follower_id = $1 AND f.status = 'accepted'`,
      [userId],
    );
    return rows;
  },
};

module.exports = Profile;
