const Post = require('../models/Home');

// Get all posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.getAllPostsWithDetails(req.user.id);
    res.json(posts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: 'Server error while fetching posts' });
  }
};

// Create post (req.user set by jwtverify middleware)
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) 
      return res.status(400).json({ error: 'Content is required' });

    const newPost = await Post.createPost(req.user.id, content.trim());
    res.status(201).json({ 
      id: newPost.id,
      content: newPost.content,
      created_at: newPost.created_at,
      username: req.user.username,
      avatar_url: req.user.avatar_url,
      likecount: 0,
      commentcount: 0,
      likedByUser: false,
      comments: []
    });
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: 'Server error while creating post' });
  }
};

// Like/unlike post
exports.likePost = async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const userId = req.user.id;

    const { liked, likecount } = await Post.toggleLike(postId, userId); // ✅ destructure both
    res.json({ liked, likecount }); // ✅ send both to frontend
  } catch (err) {
    console.error("Error liking/unliking post:", err);
    res.status(500).json({ error: 'Server error while toggling like' });
  }
};



// Add comment to post
exports.commentPost = async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const { text } = req.body;
    if (!text || !text.trim()) 
      return res.status(400).json({ error: 'Comment text is required' });

    const newComment = await Post.addComment(req.user.id, postId, text.trim());
    
    res.json({
      id: newComment.id,
      text: newComment.text,
      time: newComment.time,
      user: newComment.user
    });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: 'Server error while adding comment' });
  }
};
