const express = require("express");
const {
  getCommunityPosts,
  createCommunityPost,
  likePost,
  updatePost,
  deletePost,
  addComment,
} = require("../controllers/communityController");

const { jwtverify } = require("../middlewares/auth");

const router = express.Router();

router.get("/:communityId/posts", jwtverify, getCommunityPosts);
router.post("/:communityId/posts", jwtverify, createCommunityPost);

router.post("/:communityId/posts/:postId/like", jwtverify, likePost);
router.put("/:communityId/posts/:postId", jwtverify, updatePost);
router.delete("/:communityId/posts/:postId", jwtverify, deletePost);

router.post("/:communityId/posts/:postId/comment", jwtverify, addComment);

module.exports = router;