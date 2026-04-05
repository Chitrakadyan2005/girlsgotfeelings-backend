const Chat = require("../models/dm");
const pool = require("../config/db");
const Profile = require("../models/Profile");
const Notification = require("../models/Notification");

exports.canDM = async (req, res, next) => {
  const senderId = req.user.id;
  const receiverId =
    Number(req.params.userId) ||
    Number(req.query.receiverId) ||
    (req.body ? Number(req.body.receiverId) : null);

  if (!receiverId) {
    return res.status(400).json({ error: "receiverId required" });
  }

  if (senderId === receiverId) {
    return res.status(400).json({ error: "You cannot message yourself" });
  }

  // BLOCK CHECK
  const blocked = await pool.query(
    `
  SELECT 1 FROM blocked_users
  WHERE 
    (blocker_id = $1 AND blocked_id = $2)
    OR
    (blocker_id = $2 AND blocked_id = $1)
  `,
    [senderId, receiverId],
  );

  if (blocked.rows.length > 0) {
    return res.status(403).json({ error: "User blocked" });
  }

  const { rows: wl } = await pool.query(
    `
  SELECT 1 FROM dm_whitelist
  WHERE user_id = $1 AND allowed_user_id = $2
  `,
    [receiverId, senderId],
  );

  if (wl.length > 0) {
    return next();
  }

  const { rows } = await pool.query(
    `SELECT dm_permission FROM users WHERE id = $1`,
    [receiverId],
  );

  if (!rows.length) {
    return res.status(404).json({ error: "Receiver not found" });
  }

  const permission = rows[0].dm_permission;

  let allowed = false;

  if (permission === "everyone") allowed = true;

  if (permission === "following") {
    allowed = await Profile.isFollowing(senderId, receiverId);
  }

  if (permission === "mutual") {
    const a = await Profile.isFollowing(senderId, receiverId);
    const b = await Profile.isFollowing(receiverId, senderId);
    allowed = a && b;
  }

  if (!allowed) {
    const { rows: existing } = await pool.query(
      `
    SELECT 1 FROM notifications
    WHERE user_id = $1
      AND from_user_id = $2
      AND type = 'dm_request'
    `,
      [receiverId, senderId],
    );

    if (existing.length === 0) {
      await Notification.create(
        receiverId,
        senderId,
        "dm_request",
        "wants to message you",
      );
    }

    return res.status(403).json({
      error: "DM request sent",
      requestRequired: true,
    });
  }

  next();
};

exports.getDMRequests = async (req, res) => {
  const userId = req.user.id;

  const { rows } = await pool.query(
    `
    SELECT n.id, n.from_user_id, u.username, u.avatar_url
    FROM notifications n
    JOIN users u ON u.id = n.from_user_id
    WHERE n.user_id = $1 AND n.type = 'dm_request'
    ORDER BY n.created_at DESC
    `,
    [userId],
  );

  res.json(rows);
};

exports.acceptDM = async (req, res) => {
  const userId = req.user.id;
  const fromUserId = Number(req.params.fromUserId);

  await pool.query(
    `
    INSERT INTO dm_whitelist (user_id, allowed_user_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    `,
    [userId, fromUserId],
  );

  await Notification.deleteDMRequest(fromUserId, userId);

  await Notification.create(
    fromUserId,
    userId,
    "dm_accepted",
    "accepted your message request",
  );

  res.json({ success: true });
};

exports.rejectDM = async (req, res) => {
  const userId = req.user.id;
  const fromUserId = Number(req.params.fromUserId);

  await Notification.deleteDMRequest(fromUserId, userId);

  await Notification.create(
    fromUserId,
    userId,
    "dm_rejected",
    "rejected your message request",
  );

  res.json({ success: true });
};

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
    const userId = req.user.id;
    const otherUserId = parseInt(req.params.userId, 10);

    if (!otherUserId) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    if (userId === otherUserId) {
      return res.status(400).json({ error: "Cannot fetch self messages" });
    }

    const messages = await Chat.getChatWithUser(userId, otherUserId);

    res.json(messages);
  } catch (err) {
    console.error("getMessages error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.sendMessages = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: "receiverId required" });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    const { rows: wl } = await pool.query(
      `SELECT 1 FROM dm_whitelist WHERE user_id=$1 AND allowed_user_id=$2`,
      [receiverId, senderId],
    );

    const saved = await Chat.sendMessage(senderId, receiverId, message.trim());
    res.status(201).json(saved);
  } catch (err) {
    console.error("sendMessages error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const blockerId = req.user.id;
    const blockedId = Number(req.params.userId);

    if (!blockedId) {
      return res.status(400).json({ error: "UserId required" });
    }

    await pool.query(
      `
      INSERT INTO blocked_users (blocker_id, blocked_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [blockerId, blockedId]
    );

    res.json({ success: true, message: "User blocked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = Number(req.params.userId);

    await pool.query(
      `
      DELETE FROM messages
      WHERE 
        (sender_id = $1 AND receiver_id = $2)
        OR
        (sender_id = $2 AND receiver_id = $1)
      `,
      [userId, otherUserId]
    );

    res.json({ success: true, message: "Chat deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reportUser = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const reportedUserId = Number(req.params.userId);
    const { reason } = req.body;

    await pool.query(
      `
      INSERT INTO reports (reporter_id, reported_user_id, reason)
      VALUES ($1, $2, $3)
      `,
      [reporterId, reportedUserId, reason || null]
    );

    res.json({ success: true, message: "User reported" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};