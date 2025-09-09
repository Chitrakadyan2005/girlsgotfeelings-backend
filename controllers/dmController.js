const Chat = require('../models/dm');

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from middleware
    const users = await Chat.getConversationsList(userId);
    res.json(users);
  } catch (err) {
    console.error("getConversations error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id; // current logged in user
    const otherUserId = req.params.userId; // yaha ab actual id aayegi

    const messages = await Chat.getChatWithUser(userId, otherUserId);
    res.json(messages);
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.sendMessages = async (req, res) => {
  try {
    console.log("Decoded user:", req.user);  // check JWT user
    console.log("Body:", req.body);          // check body

    const senderId = req.user.id || req.user._id;
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ error: "receiverId and message are required" });
    }

    const saved = await Chat.sendMessage(senderId, receiverId, message);
    res.status(201).json(saved);
  } catch (err) {
    console.error("sendMessages error:", err);
    res.status(500).json({ error: err.message });
  }
};
