const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

const LOCAL_USERS_FILE = path.join(__dirname, "../local_users.json");

function getLocalUsers() {
    try {
        if (fs.existsSync(LOCAL_USERS_FILE)) {
            const data = fs.readFileSync(LOCAL_USERS_FILE, "utf-8");
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch {}
    return [
        { _id: "u-joker", username: "joker", createdAt: new Date() },
        { _id: "u-Mohanraj", username: "Mohanraj", createdAt: new Date() },
        { _id: "u-GOD", username: "GOD", createdAt: new Date() },
        { _id: "u-nezuko", username: "nezuko", createdAt: new Date() },
        { _id: "u-Dora", username: "Dora", createdAt: new Date() },
        { _id: "u-Ruler", username: "Ruler", createdAt: new Date() }
    ];
}

function saveLocalUsers(list) {
    try {
        fs.writeFileSync(LOCAL_USERS_FILE, JSON.stringify(list, null, 2), "utf-8");
    } catch {}
}

// Get all other registered users (never returns the logged-in user)
router.get("/users", auth, async (req, res) => {
    const myName = (req.user?.username || "").trim().toLowerCase();
    const localList = getLocalUsers();
    const filtered = localList
        .filter((u) => u.username && u.username.toLowerCase() !== myName)
        .map((u) => ({ _id: u._id, username: u.username, createdAt: u.createdAt }));
    res.json(filtered);
});

router.post("/register", async (req, res) => {
    try {
        const username = (req.body.username || "").trim();
        const password = req.body.password || "pearlbee";
        if (!username) {
            return res.status(400).json({ error: "Username required" });
        }

        const localList = getLocalUsers();
        let existing = localList.find(
            (u) => (u.username || "").toLowerCase() === username.toLowerCase()
        );
        if (!existing) {
            localList.push({
                _id: `u-${Date.now()}`,
                username,
                createdAt: new Date()
            });
            saveLocalUsers(localList);
        }

        const token = jwt.sign(
            { id: `u-${username}`, username },
            process.env.JWT_SECRET || "chat_app_jwt_secret",
            { expiresIn: "30d" }
        );
        res.json({ token, username, message: "User created!" });
    } catch (err) {
        res.status(400).json({ error: err.message || "Failed to create user" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const username = (req.body.username || "").trim();
        const password = req.body.password || "pearlbee";
        if (!username) {
            return res.status(400).json({ error: "Username required" });
        }

        const localList = getLocalUsers();
        let user = localList.find(
            (u) => (u.username || "").toLowerCase() === username.toLowerCase()
        );
        if (!user) {
            user = {
                _id: `u-${Date.now()}`,
                username,
                createdAt: new Date()
            };
            localList.push(user);
            saveLocalUsers(localList);
        }

        const token = jwt.sign(
            { id: user._id || `u-${username}`, username },
            process.env.JWT_SECRET || "chat_app_jwt_secret",
            { expiresIn: "30d" }
        );
        res.json({ token, username, message: "Authentication successful" });
    } catch (err) {
        console.error("LOGIN ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Single-step Auto-Register & Auto-Login for Nezuko SSO
router.post("/sso", async (req, res) => {
    try {
        const username = (req.body.username || "").trim();
        if (!username) {
            return res.status(400).json({ error: "Username required" });
        }

        const token = jwt.sign(
            { id: `u-${username}`, username },
            process.env.JWT_SECRET || "chat_app_jwt_secret",
            { expiresIn: "30d" }
        );

        res.json({ token, username, message: "SSO Login successful" });
    } catch (err) {
        res.status(500).json({ error: err.message || "SSO Login failed" });
    }
});

module.exports = router;
