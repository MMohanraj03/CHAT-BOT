const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { User, ChatUser } = require("../models/user");
const auth = require("../middleware/auth");

const LOCAL_USERS_FILE = path.join(__dirname, "../local_users.json");

const SEED_USERS = [
    { _id: "u-joker", username: "joker", avatar: "/avatars/joker.jpg", createdAt: new Date() },
    { _id: "u-Mohanraj", username: "Mohanraj", avatar: "/avatars/joker.jpg", createdAt: new Date() },
    { _id: "u-GOD", username: "GOD", avatar: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=150&q=80", createdAt: new Date() },
    { _id: "u-nezuko", username: "nezuko", avatar: "/avatars/nezuko.jpg", createdAt: new Date() },
    { _id: "u-Dora", username: "Dora", avatar: "/logo_eye.jpg", createdAt: new Date() },
    { _id: "u-Ruler", username: "Ruler", avatar: "/logo_eye.jpg", createdAt: new Date() }
];

function getLocalUsers() {
    try {
        if (fs.existsSync(LOCAL_USERS_FILE)) {
            const data = fs.readFileSync(LOCAL_USERS_FILE, "utf-8");
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Ensure seed users are always present
                const map = new Map();
                SEED_USERS.forEach((u) => map.set(u.username.toLowerCase(), u));
                parsed.forEach((u) => {
                    if (u && u.username) map.set(u.username.toLowerCase(), u);
                });
                return Array.from(map.values());
            }
        }
    } catch {}
    return SEED_USERS;
}

function saveLocalUsers(list) {
    try {
        fs.writeFileSync(LOCAL_USERS_FILE, JSON.stringify(list, null, 2), "utf-8");
    } catch {}
}

// Background sync to Cloud & MongoDB Atlas
async function syncUserToDatabase(username) {
    if (!username) return;
    // 1. Try MongoDB Atlas if connected
    if (mongoose.connection.readyState === 1) {
        try {
            await User.updateOne(
                { username: new RegExp(`^${username}$`, "i") },
                { $set: { username, lastActive: new Date() } },
                { upsert: true }
            );
            await ChatUser.updateOne(
                { username: new RegExp(`^${username}$`, "i") },
                { $set: { username, lastActive: new Date() } },
                { upsert: true }
            );
        } catch (dbErr) {
            console.warn("[MongoDB User Sync]:", dbErr.message);
        }
    }

    // 2. Sync to cloud API
    try {
        fetch("https://nezuko-01.vercel.app/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password: "pearlbee" })
        }).catch(() => {});
    } catch {}
}

// GET all users
router.get("/", async (req, res) => {
    const users = getLocalUsers().map((u) => ({
        _id: u._id || `u-${u.username}`,
        username: u.username,
        avatar: u.avatar || "/logo_eye.jpg",
        createdAt: u.createdAt
    }));
    res.json(users);
});

// GET users excluding logged-in user
router.get("/users", auth, async (req, res) => {
    const myName = (req.user?.username || "").trim().toLowerCase();
    const localList = getLocalUsers();
    const filtered = localList
        .filter((u) => u.username && u.username.toLowerCase() !== myName)
        .map((u) => ({
            _id: u._id || `u-${u.username}`,
            username: u.username,
            avatar: u.avatar || "/logo_eye.jpg",
            createdAt: u.createdAt
        }));
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
            existing = {
                _id: `u-${username}`,
                username,
                avatar: "/logo_eye.jpg",
                createdAt: new Date()
            };
            localList.push(existing);
            saveLocalUsers(localList);
        }

        // Fire-and-forget sync to Atlas and Cloud
        syncUserToDatabase(username);

        const token = jwt.sign(
            { id: existing._id, username },
            process.env.JWT_SECRET || "chat_app_jwt_secret",
            { expiresIn: "30d" }
        );
        res.json({ token, username, message: "User registered successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message || "Failed to register" });
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
                _id: `u-${username}`,
                username,
                avatar: "/logo_eye.jpg",
                createdAt: new Date()
            };
            localList.push(user);
            saveLocalUsers(localList);
        }

        // Fire-and-forget sync to Atlas and Cloud
        syncUserToDatabase(username);

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

// Single-step Auto-Register & Auto-Login for SSO
router.post("/sso", async (req, res) => {
    try {
        const username = (req.body.username || "").trim();
        if (!username) {
            return res.status(400).json({ error: "Username required" });
        }

        const localList = getLocalUsers();
        let user = localList.find(
            (u) => (u.username || "").toLowerCase() === username.toLowerCase()
        );
        if (!user) {
            user = {
                _id: `u-${username}`,
                username,
                avatar: "/logo_eye.jpg",
                createdAt: new Date()
            };
            localList.push(user);
            saveLocalUsers(localList);
        }

        syncUserToDatabase(username);

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
