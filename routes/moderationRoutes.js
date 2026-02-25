const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { moderateContent } = require("../controllers/moderationController");
const { jwtverify } = require("../middlewares/auth");

const moderationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    allowed: false,
    action: "rate_limited",
    message: "Too many requests. Please slow down."
  }
});

router.post("/moderate",jwtverify, moderationLimiter, moderateContent);

module.exports = router;