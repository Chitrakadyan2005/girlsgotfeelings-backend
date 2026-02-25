const express = require("express");
const router = express.Router();
const { getBotReply } = require("../controllers/botController");

router.post("/reply", getBotReply);

module.exports = router;