const Profile = require('../models/Profile');

exports.getProfile = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();

    const [profile, posts, stats] = await Promise.all([
      Profile.getUserProfileByUsername(username),
      Profile.getUserPostsByUsername(username),
      Profile.getUserStatsByUsername(username)
    ]);

    if (!profile) return res.status(404).json({ error: "User not found" });

    res.json({
      id: profile.id,
      username: profile.username,
      bio: profile.bio || '',
      joinDate: profile.joinDate,
      avatarUrl: profile.avatar_url || '/pfps/default.png',
      posts: posts.map(p => ({
        id: p.id,
        content: p.content,
        time: p.time,
        likes: p.likes
      })),
      stats: {
        postCount: stats.postCount || 0,
        followers: stats.followerCount || 0,
        following: stats.followingCount || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.followUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.targetId);

    if (followerId === followingId)
      return res.status(400).json({ error: "You cannot follow yourself" });

    await Profile.followUser(followerId, followingId);

    const targetStats = await Profile.getUserStatsById(followingId);

    res.json({ targetFollowerCount: targetStats.followerCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const followerId = req.user.id;
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
    const followingId = parseInt(req.params.targetId);

    const following = await Profile.isFollowing(userId, followingId);
    res.json({ isFollowing: following });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const followers = await Profile.getFollowers(userId);
    res.json({ followers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const following = await Profile.getFollowing(userId);
    res.json({ following });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    let avatarUrl = "";

    if (req.file) avatarUrl = `/uploads/${req.file.filename}`;
    else if (req.body.avatarUrl) avatarUrl = req.body.avatarUrl;

    if (!avatarUrl) return res.status(400).json({ error: "No avatar provided" });

    await Profile.updateAvatar(req.user.id, avatarUrl);

    res.json({ avatarUrl });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
