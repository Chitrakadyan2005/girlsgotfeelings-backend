const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

function jwtverify(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization token is missing' });
    }

    const token = authHeader.split(" ")[1]; // Remove 'Bearer '

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log("Decoded JWT:", decoded);
        console.log(req.user);

        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { jwtverify };
