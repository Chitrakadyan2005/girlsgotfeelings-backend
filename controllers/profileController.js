const Profile = require("../models/Profile");
const Notification = require("../models/Notification");
const pool = require("../config/db");

exports.getProfile = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();

    const [profile, posts, stats] = await Promise.all([
      Profile.getUserProfileByUsername(username),
      Profile.getUserPostsByUsername(username),
      Profile.getUserStatsByUsername(username),
    ]);

    if (!profile) return res.status(404).json({ error: "User not found" });

    res.json({
      id: profile.id,
      username: profile.username,
      bio: profile.bio || "",
      isPrivate: profile.is_private,
      joinDate: profile.joinDate,
      avatarUrl: profile.avatar_url || "/pfps/default.png",
      posts: posts.map((p) => ({
        id: p.id,
        content: p.content,
        time: p.time,
        likes: p.likes,
      })),
      stats: {
        postCount: stats?.postCount || 0,
        followers: stats?.followerCount || 0,
        following: stats?.followingCount || 0,
      },
    });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, bio, dm_permission, is_private } = req.body;

    if (!username) return res.status(400).json({ error: "Username required" });

    const dbUser = await Profile.getUserByFirebaseUid(req.user.firebaseUid);
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    const exists = await Profile.getUserProfileByUsername(
      username.toLowerCase(),
    );
    if (exists && exists.id !== dbUser.id) {
      return res.status(400).json({ error: "Username already taken" });
    }

    if (dm_permission !== undefined) {
      await pool.query(`UPDATE users SET dm_permission = $1 WHERE id = $2`, [
        dm_permission,
        dbUser.id,
      ]);
    }
    if (is_private !== undefined) {
      await pool.query(`UPDATE users SET is_private = $1 WHERE id = $2`, [
        is_private,
        dbUser.id,
      ]);
    }

    const updated = await Profile.updateProfile(dbUser.id, username, bio);

    const fullProfile = await Profile.getUserProfileByUsername(
      updated.username,
    );
    const posts = await Profile.getUserPostsByUsername(updated.username);
    const stats = await Profile.getUserStatsByUsername(updated.username);

    res.json({
      id: fullProfile.id,
      username: fullProfile.username,
      bio: fullProfile.bio || "",
      joinDate: fullProfile.joinDate,
      avatarUrl: fullProfile.avatar_url || "/pfps/default.png",
      posts: posts.map((p) => ({
        id: p.id,
        content: p.content,
        time: p.time,
        likes: p.likes,
      })),
      stats: {
        postCount: stats?.postCount || 0,
        followers: stats?.followerCount || 0,
        following: stats?.followingCount || 0,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updatePrivacy = async (req, res) => {
  try {
    const { is_private } = req.body;

    if (is_private === undefined) {
      return res.status(400).json({ error: "is_private required" });
    }

    const dbUser = await Profile.getUserByFirebaseUid(req.user.firebaseUid);
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    await pool.query(
      `UPDATE users SET is_private = $1 WHERE id = $2`,
      [is_private, dbUser.id]
    );

    res.json({ success: true, is_private });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.followUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.targetId, 10);

    if (!followingId) {
      return res.status(400).json({ error: "Invalid user" });
    }

    if (followerId === followingId) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    const targetUser = await Profile.getUserById(followingId);
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    const status = targetUser.isPrivate ? "pending" : "accepted";

    await Profile.followUser(followerId, followingId, status);
    console.log("TARGET USER PRIVACY:", targetUser.isPrivate);
    if (status === "pending") {
      await Notification.create(
        followingId,
        followerId,
        "follow_request",
        "sent you a follow request",
      );
    }

    let followerCount = null;
    if (status === "pending") {
      const targetStats = await Profile.getUserStatsById(followingId);
      followerCount = targetStats.followerCount;
    }

    const stats = await Profile.getUserStatsById(followingId);

    res.json({
      success: true,
      status,
      targetFollowerCount: stats.followerCount,
    });
  } catch (err) {
    console.error("followUser error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const dbUser = await Profile.getUserByFirebaseUid(req.user.firebaseUid);
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    const followerId = dbUser.id;
    const followingId = parseInt(req.params.targetId);

    await Profile.unfollowUser(followerId, followingId);

    const targetStats = await Profile.getUserStatsById(followingId);
    res.json({ targetFollowerCount: targetStats.followerCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.isFollowing = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = parseInt(req.params.targetId);

    if (!targetId) {
      return res.status(400).json({ error: "targetId required" });
    }

    const status = await Profile.getFollowStatus(userId, targetId);

    res.json({
      isFollowing: status.isFollowing,
      isPending: status.isPending,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const dbUser = await Profile.getUserByFirebaseUid(req.user.firebaseUid);

    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = parseInt(req.params.userId);
    const followers = await Profile.getFollowers(userId);
    res.json({ followers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const dbUser = await Profile.getUserByFirebaseUid(req.user.firebaseUid);

    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = parseInt(req.params.userId);
    const following = await Profile.getFollowing(userId);
    res.json({ following });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLikedPosts = async (req, res) => {
  try {
    const dbUser = await Profile.getUserByFirebaseUid(req.user.firebaseUid);

    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await Profile.getLikedPosts(dbUser.id);
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCommentedPosts = async (req, res) => {
  try {
    const dbUser = await Profile.getUserByFirebaseUid(req.user.firebaseUid);

    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await Profile.getCommentedPosts(dbUser.id);
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    let avatarUrl = "";

    if (req.file) avatarUrl = `/uploads/${req.file.filename}`;
    else if (req.body.avatarUrl) avatarUrl = req.body.avatarUrl;

    if (!avatarUrl)
      return res.status(400).json({ error: "No avatar provided" });

    const dbUser = await Profile.getUserByFirebaseUid(req.user.firebaseUid);

    if (!dbUser) return res.status(404).json({ error: "User not found" });

    await Profile.updateAvatar(dbUser.id, avatarUrl);

    const fullProfile = await Profile.getUserProfileByUsername(dbUser.username);
    const posts = await Profile.getUserPostsByUsername(dbUser.username);
    const stats = await Profile.getUserStatsByUsername(dbUser.username);

    res.json({
      id: fullProfile.id,
      username: fullProfile.username,
      bio: fullProfile.bio || "",
      joinDate: fullProfile.joinDate,
      avatarUrl: avatarUrl,
      posts: posts.map((p) => ({
        id: p.id,
        content: p.content,
        time: p.time,
        likes: p.likes,
      })),
      stats: {
        postCount: stats?.postCount || 0,
        followers: stats?.followerCount || 0,
        following: stats?.followingCount || 0,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
