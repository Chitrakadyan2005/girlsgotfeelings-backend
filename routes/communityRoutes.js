const express = require("express");
const {
  getCommunityPosts,
  createCommunityPost,
  likePost,
  updatePost,
  deletePost,
  addComment,
  getLikedPosts,
  getCommentedPosts,
  getMyPosts,
} = require("../controllers/communityController");

const { jwtverify } = require("../middlewares/auth");

const router = express.Router();

router.get("/liked-posts", jwtverify, getLikedPosts);
router.get("/commented-posts", jwtverify, getCommentedPosts);
router.get("/my-posts", jwtverify, getMyPosts);

router.get("/:communityId/posts", jwtverify, getCommunityPosts);
router.post("/:communityId/posts", jwtverify, createCommunityPost);

router.post("/:communityId/posts/:postId/like", jwtverify, likePost);
router.put("/:communityId/posts/:postId", jwtverify, updatePost);
router.delete("/:communityId/posts/:postId", jwtverify, deletePost);

router.post("/:communityId/posts/:postId/comment", jwtverify, addComment);

module.exports = router;