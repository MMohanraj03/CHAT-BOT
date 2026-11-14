const router = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

// Get all other registered users (never returns the logged-in user)
router.get("/users", auth, async (req, res) => {
    try {
        const myName = (req.user.username || "").trim();
        const users = await User.find({
            username: { $not: new RegExp(`^${myName}$`, "i") }
        }).select("username createdAt");
        res.json(users);
    } catch (err) {
        console.error("User error", err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post("/register", async (req, res) => {
    try {
        const username = (req.body.username || "").trim();
        const password = req.body.password;
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password required" });
        }

        const existing = await User.findOne({
            username: new RegExp(`^${username}$`, "i")
        });
        if (existing) {
            return res.status(400).json({ error: "Username already taken" });
        }

        const hashed = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashed });
        res.json({ message: "User created!" });
    } catch (err) {
        res.status(400).json({ error: err.message || "Failed to create user" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const username = (req.body.username || "").trim();
        const password = req.body.password;
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password required" });
        }

        const user = await User.findOne({
            username: new RegExp(`^${username}$`, "i")
        });
        if (!user) return res.status(400).json({ error: "User not found" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: "wrong password" });

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        res.json({ token, username: user.username });
    } catch (err) {
        console.error("LOGIN ERROR...", err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
