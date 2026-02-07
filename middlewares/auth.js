const admin = require("../config/firebase");

async function jwtverify(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    console.log("AUTH HEADER:", req.headers.authorization);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const token = authHeader.split(" ")[1];

    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
    });
  }
}

module.exports = { jwtverify };
