const admin = require("../config/firebase");

function jwtverify(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
    });
  }

  const token = authHeader.split(" ")[1];

  admin
    .auth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      req.user = {
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
      };

      next();
    })
    .catch(() => {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    });
}

module.exports = { jwtverify };
