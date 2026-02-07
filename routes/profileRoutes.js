const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { jwtverify } = require('../middlewares/auth'); // import the middleware
const multer = require('multer');

// Avatar upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

router.post('/follow/:targetId', jwtverify, profileController.followUser);
router.post('/unfollow/:targetId', jwtverify, profileController.unfollowUser);
router.get('/is-following/:targetId', jwtverify, profileController.isFollowing);
router.get('/followers/:userId', jwtverify, profileController.getFollowers);
router.get('/following/:userId', jwtverify, profileController.getFollowing);
router.put('/avatar', jwtverify, upload.single('avatar'), profileController.updateAvatar);
router.put('/edit', jwtverify, profileController.updateProfile);
router.get('/liked-posts', jwtverify, profileController.getLikedPosts);
router.get('/commented-posts', jwtverify, profileController.getCommentedPosts);
router.get('/:username', profileController.getProfile);

module.exports = router;
