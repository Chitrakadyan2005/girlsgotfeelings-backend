const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const { jwtverify } = require('../middlewares/auth');

router.get('/posts', jwtverify, homeController.getAllPosts);
router.post('/posts', jwtverify, homeController.createPost); // <-- add middleware
router.post('/posts/:postId/like', jwtverify, homeController.likePost);
router.post('/posts/:postId/comment', jwtverify, homeController.commentPost);

module.exports = router;
