const db = require("../config/db"); // ⚠️ adjust path if needed

const getCommunityPosts = async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user.id;

  const posts = await db.query(
    `
    SELECT 
      p.*,
      COUNT(DISTINCT l.id) AS likecount,
      EXISTS (
        SELECT 1 FROM community_likes 
        WHERE post_id = p.id AND user_id = $1
      ) AS "likedByUser",
      COUNT(DISTINCT c.id) AS commentcount
    FROM community_posts p
    LEFT JOIN community_likes l ON l.post_id = p.id
    LEFT JOIN community_comments c ON c.post_id = p.id
    WHERE p.community_id = $2
    GROUP BY p.id
    ORDER BY p.created_at DESC
    `,
    [userId, communityId]
  );

  res.json(posts.rows);
};

const createCommunityPost = async (req, res) => {
  const { communityId } = req.params;
  const { content } = req.body;
  const { id, username } = req.user;

  const result = await db.query(
    `
    INSERT INTO community_posts 
    (community_id, user_id, username, content)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [communityId, id, username, content]
  );

  res.json(result.rows[0]);
};

const likePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  const exists = await db.query(
    "SELECT id FROM community_likes WHERE post_id=$1 AND user_id=$2",
    [postId, userId]
  );

  if (exists.rows.length) {
    await db.query(
      "DELETE FROM community_likes WHERE post_id=$1 AND user_id=$2",
      [postId, userId]
    );
    return res.json({ liked: false });
  }

  await db.query(
    "INSERT INTO community_likes (post_id, user_id) VALUES ($1, $2)",
    [postId, userId]
  );

  res.json({ liked: true });
};

const addComment = async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  const { id, username } = req.user;

  const result = await db.query(
    `
    INSERT INTO community_comments
    (post_id, user_id, username, text)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [postId, id, username, text]
  );

  res.json(result.rows[0]);
};

const updatePost = async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  const check = await db.query(
    "SELECT user_id FROM community_posts WHERE id=$1",
    [postId]
  );

  if (!check.rows.length || check.rows[0].user_id !== userId) {
    return res.status(403).json({ error: "Not allowed" });
  }

  await db.query(
    "UPDATE community_posts SET content=$1, updated_at=NOW() WHERE id=$2",
    [content, postId]
  );

  res.json({ success: true });
};

const deletePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  const check = await db.query(
    "SELECT user_id FROM community_posts WHERE id=$1",
    [postId]
  );

  if (!check.rows.length || check.rows[0].user_id !== userId) {
    return res.status(403).json({ error: "Not allowed" });
  }

  await db.query(
    "DELETE FROM community_posts WHERE id=$1",
    [postId]
  );

  res.json({ success: true });
};

module.exports = {
  getCommunityPosts,
  createCommunityPost,
  likePost,
  addComment,
  updatePost,
  deletePost,
};