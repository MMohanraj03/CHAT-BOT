const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const rawAuth = req.headers.authorization || "";
    const token = rawAuth.startsWith("Bearer ") ? rawAuth.slice(7).trim() : rawAuth.trim();

    // 1. Support nezuko_jwt_ base64 token
    if (token && token.startsWith("nezuko_jwt_")) {
        try {
            const username = Buffer.from(token.replace("nezuko_jwt_", ""), "base64").toString("utf8");
            req.user = { id: `u-${username}`, username };
            return next();
        } catch {}
    }

    // 2. Support standard JWT verification
    if (token) {
        try {
            const secret = process.env.JWT_SECRET || "chat_app_jwt_secret";
            const decoded = jwt.verify(token, secret);
            req.user = decoded;
            return next();
        } catch {}

        // Fallback: decode payload
        try {
            const parts = token.split(".");
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
                if (payload && (payload.username || payload.name)) {
                    req.user = { id: payload.id || `u-${payload.username}`, username: payload.username || payload.name };
                    return next();
                }
            }
        } catch {}
    }

    // 3. Fallback: x-user or query parameter
    const userHeader = req.headers["x-user"] || req.headers["x-username"] || req.query.user || req.query.username;
    if (userHeader) {
        req.user = { id: `u-${userHeader}`, username: String(userHeader).trim() };
        return next();
    }

    if (!token) return res.status(401).json({ error: "No token provided" });
    res.status(401).json({ error: "Invalid token" });
};
