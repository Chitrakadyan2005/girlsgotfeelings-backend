const User = require('../models/User');
const pool = require('../config/db');
const Profile = require("../models/Profile");

exports.setupUsername = async (req, res) => {
  try {
    const { username, password } = req.body;
    const { firebaseUid, email } = req.user;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: "Username required" });
    }

    const cleanUsername = username.trim().toLowerCase();

    const existing = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [cleanUsername]
    );

    if (existing.rows.length) {
      return res.status(400).json({ error: "Username already taken" });
    }

    await User.findOrCreateByFirebase(firebaseUid, email);

    if (password && password.trim()) {
      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }

      await admin.auth().updateUser(firebaseUid, {
        password: password,
      });
    }

    const { rowCount } = await pool.query(
      `
      UPDATE users
      SET username = $1
      WHERE firebase_uid = $2
      `,
      [cleanUsername, firebaseUid]
    );

    if (!rowCount) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      success: true,
      username: cleanUsername,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to set username" });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    let user;

    if (req.user.firebaseUid) {
      const result = await pool.query(
        'SELECT id FROM users WHERE firebase_uid = $1',
        [req.user.firebaseUid]
      );
      if (!result.rows.length) throw new Error('User not found');
      user = result.rows[0];
    } else {
      user = { id: req.user.id };
    }

    await User.delete(user.id);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.syncFirebaseUser = async (req, res) => {
  try {
    const { firebaseUid, email } = req.user;

    const user = await User.findOrCreateByFirebase(firebaseUid, email);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'User sync failed',
    });
  }
};

exports.firebaseLogin = async (req, res) => {
  try {
    const { firebaseUid, email } = req.user;

    const user = await User.findOrCreateByFirebase(firebaseUid, email);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Firebase login failed',
    });
  }
};


exports.me = async (req, res) => {
  try {
    const dbUser = await Profile.getUserByFirebaseUid(req.user.firebaseUid);

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: dbUser.id,
        username: dbUser.username,
        bio: dbUser.bio || "",
        avatarUrl: dbUser.avatar_url || "/pfps/default.png",
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};


exports.getEmailByUsername = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    const { rows } = await pool.query(
      "SELECT email FROM users WHERE username = $1",
      [username.toLowerCase()]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ email: rows[0].email });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch email" });
  }
};
