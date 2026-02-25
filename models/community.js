const pool = require("../config/db");

const Community = {

  async getPosts(communityId, userId) {
    const { rows } = await pool.query(
      `
      SELECT 
        p.id,
        p.content,
        p.username,
        p.user_id,
        p.created_at,
        COUNT(DISTINCT l.id) AS likecount,
        COUNT(DISTINCT c.id) AS commentcount,
        EXISTS (
          SELECT 1 FROM community_likes 
          WHERE post_id = p.id AND user_id = $2
        ) AS "likedByUser"
      FROM community_posts p
      LEFT JOIN community_likes l ON l.post_id = p.id
      LEFT JOIN community_comments c ON c.post_id = p.id
      WHERE p.community_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
      `,
      [communityId, userId]
    );

    return rows;
  },

  async createPost({ communityId, userId, username, content }) {
    const { rows } = await pool.query(
      `
      INSERT INTO community_posts (community_id, user_id, username, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [communityId, userId, username, content]
    );

    return rows[0];
  },

  async updatePost(postId, content) {
    await pool.query(
      `
      UPDATE community_posts
      SET content = $1, updated_at = NOW()
      WHERE id = $2
      `,
      [content, postId]
    );
  },

  async deletePost(postId) {
    await pool.query(
      `DELETE FROM community_posts WHERE id = $1`,
      [postId]
    );
  },

  async getPostOwner(postId) {
    const { rows } = await pool.query(
      `SELECT user_id FROM community_posts WHERE id = $1`,
      [postId]
    );
    return rows[0];
  },

  async hasLiked(postId, userId) {
    const { rows } = await pool.query(
      `
      SELECT id FROM community_likes
      WHERE post_id = $1 AND user_id = $2
      `,
      [postId, userId]
    );

    return rows.length > 0;
  },

  async likePost(postId, userId) {
    await pool.query(
      `
      INSERT INTO community_likes (post_id, user_id)
      VALUES ($1, $2)
      `,
      [postId, userId]
    );
  },

  async unlikePost(postId, userId) {
    await pool.query(
      `
      DELETE FROM community_likes
      WHERE post_id = $1 AND user_id = $2
      `,
      [postId, userId]
    );
  },

  async addComment({ postId, userId, username, text }) {
    const { rows } = await pool.query(
      `
      INSERT INTO community_comments (post_id, user_id, username, text)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [postId, userId, username, text]
    );

    return rows[0];
  },

  async getComments(postId) {
    const { rows } = await pool.query(
      `
      SELECT * FROM community_comments
      WHERE post_id = $1
      ORDER BY created_at ASC
      `,
      [postId]
    );

    return rows;
  }
};

module.exports = Community;