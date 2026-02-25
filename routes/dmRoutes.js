const express = require("express");
const router = express.Router();
const chatController = require("../controllers/dmController");
const { jwtverify } = require("../middlewares/auth");
const { canDM } = require("../controllers/dmController");

router.get("/chat/list", jwtverify, chatController.getConversations);
router.get("/requests", jwtverify, chatController.getDMRequests);

router.post(
  "/request/accept/:fromUserId",
  jwtverify,
  chatController.acceptDM
);

router.post(
  "/request/reject/:fromUserId",
  jwtverify,
  chatController.rejectDM
);
router.get(
  "/chat/:userId",
  jwtverify,
  chatController.canDM,
  chatController.getMessages,
);
router.get("/can-dm/:userId", jwtverify, chatController.canDM, (req, res) =>
  res.json({ allowed: true }),
);
router.post("/chat/send", jwtverify, chatController.canDM, chatController.sendMessages);

module.exports = router;
