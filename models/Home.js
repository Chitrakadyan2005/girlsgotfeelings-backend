const pool = require('../config/db');

const Post = {
  // Get all posts with comments and likedByUser info
  getAllPostsWithDetails: async (userId) => {
    try {
      // Fetch all posts
      const { rows: posts } = await pool.query(
        `SELECT p.id, p.content, p.created_at, u.username, u.avatar_url
         FROM posts p
         JOIN users u ON p.user_id = u.id
         ORDER BY p.created_at DESC`
      );

      // For each post, get like count and likedByUser
      for (let post of posts) {
        const { rows: likeRows } = await pool.query(
          `SELECT COUNT(*) AS likecount,
                  EXISTS(
                    SELECT 1 FROM likes WHERE post_id = $1 AND user_id = $2
                  ) AS liked
           FROM likes
           WHERE post_id = $1`,
          [post.id, userId]
        );

        post.likecount = Number(likeRows[0].likecount);
        post.likedByUser = likeRows[0].liked;

        // Get comments
        const { rows: comments } = await pool.query(
          `SELECT c.id, u.username AS user, c.text, c.created_at AS time
           FROM comments c
           JOIN users u ON c.user_id = u.id
           WHERE c.post_id = $1
           ORDER BY c.created_at ASC`,
          [post.id]
        );
        post.comments = comments;
        post.commentcount = comments.length;
      }

      return posts;
    } catch (err) {
      throw err;
    }
  },

  createPost: async (userId, content) => {
    const { rows } = await pool.query(
      `INSERT INTO posts (user_id, content) 
       VALUES ($1, $2) 
       RETURNING id, content, created_at`,
      [userId, content]
    );
    return rows[0];
  },

  // Toggle like/unlike
  toggleLike: async (postId, userId) => {
  const existing = await pool.query(
    "SELECT * FROM likes WHERE post_id = $1 AND user_id = $2",
    [postId, userId]
  );

  let liked;
  if (existing.rows.length > 0) {
    await pool.query("DELETE FROM likes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
    liked = false;
  } else {
    await pool.query("INSERT INTO likes (post_id, user_id) VALUES ($1, $2)", [postId, userId]);
    liked = true;
  }

  const { rows } = await pool.query(
    "SELECT COUNT(*) AS likecount FROM likes WHERE post_id = $1",
    [postId]
  );

  return { liked, likecount: Number(rows[0].likecount) };
},

  addComment: async (userId, postId, text) => {
    const { rows } = await pool.query(
      "INSERT INTO comments (user_id, post_id, text) VALUES ($1, $2, $3) RETURNING id, text, created_at",
      [userId, postId, text]
    );

    const commentId = rows[0].id;

    const { rows: commentRes } = await pool.query(
      `SELECT c.id, u.username AS user, c.text, c.created_at AS time
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [commentId]
    );

    return commentRes[0];
  }
};

module.exports = Post;
