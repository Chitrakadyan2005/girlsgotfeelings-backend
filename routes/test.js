const express = require("express");
const { getAIReply } = require("../services/aiService");

const router = express.Router();

router.get("/hf-test", async (req, res) => {
  try {
    const reply = await getAIReply(
      "You are a friendly test assistant.",
      [], 
      "Say hello in one sentence."
    );

    res.json({ success: true, reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Groq failed" });
  }
});

module.exports = router;