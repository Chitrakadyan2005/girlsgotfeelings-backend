const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { jwtverify } = require("../middlewares/auth");

router.get("/", jwtverify, notificationController.getNotification);
router.post("/follow/accept/:fromUserId", jwtverify, notificationController.acceptFollow);
router.post("/follow/reject/:fromUserId", jwtverify, notificationController.rejectFollow);
router.get('/unread', jwtverify, notificationController.hasUnread);
router.post("/read", jwtverify, notificationController.markAsRead);

module.exports = router;
