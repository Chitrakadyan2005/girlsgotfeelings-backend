const Notification = require("../models/Notification");
const pool = require("../config/db");

exports.getNotification = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.getForUser(userId);

    await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1`,
      [userId],
    );

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.hasUnread = async (req, res) => {
  const userId = req.user.id;

  const { rows } = await pool.query(
    `SELECT 1 FROM notifications 
     WHERE user_id = $1 AND is_read = false 
     LIMIT 1`,
    [userId],
  );

  res.json({ hasUnread: rows.length > 0 });
};

exports.markAsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    await pool.query(
      `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1
      `,
      [userId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptFollow = async (req, res) => {
  const userId = req.user.id;          // jisne accept kiya
  const fromUserId = Number(req.params.fromUserId); // jisne request bheji

  await pool.query(
    `
    UPDATE followers
    SET status = 'accepted'
    WHERE follower_id = $1 AND following_id = $2
    `,
    [fromUserId, userId]
  );

  await Notification.deleteFollowRequest(fromUserId, userId);

  await Notification.create(
    fromUserId,
    userId,
    "follow_accepted",
    "accepted your follow request"
  );

  res.json({ success: true });
};

exports.rejectFollow = async (req, res) => {
  const userId = req.user.id;
  const fromUserId = Number(req.params.fromUserId);

  await pool.query(
    `
    DELETE FROM followers
    WHERE follower_id = $1 AND following_id = $2
    `,
    [fromUserId, userId]
  );

  await Notification.deleteFollowRequest(fromUserId, userId);

  await Notification.create(
    fromUserId,
    userId,
    "follow_rejected",
    "rejected your follow request"
  );

  res.json({ success: true });
};