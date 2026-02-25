const admin = require("../config/firebase");
const User = require("../models/User");

async function jwtverify(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token, true);

    let user = await User.findByFirebaseUid(decodedToken.uid);

    if (!user) {
      user = await User.findOrCreateByFirebase(
        decodedToken.uid,
        decodedToken.email,
      );
    }

    req.user = {
      id: user.id,
      username: user.username || null,
      avatar_url: user.avatar_url,
      firebaseUid: decodedToken.uid,
      email: user.email || decodedToken.email,
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = { jwtverify };
