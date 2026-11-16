const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Message = require("../models/message");
const auth = require("../middleware/auth");

const LOCAL_MSGS_FILE = path.join(__dirname, "../local_messages.json");

function getLocalMessages() {
    try {
        if (fs.existsSync(LOCAL_MSGS_FILE)) {
            const data = fs.readFileSync(LOCAL_MSGS_FILE, "utf-8");
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch {}
    return [];
}

function saveLocalMessages(list) {
    try {
        fs.writeFileSync(LOCAL_MSGS_FILE, JSON.stringify(list.slice(-1000), null, 2), "utf-8");
    } catch {}
}

// Get most recent message for each conversation
router.get("/conversations/recent", auth, async (req, res) => {
    const me = (req.user?.username || "").trim().toLowerCase();
    
    if (mongoose.connection.readyState === 1) {
        try {
            const meRegex = new RegExp(`^${me}$`, "i");
            const messages = await Message.find({
                $or: [{ sender: meRegex }, { receiver: meRegex }]
            }).sort({ createdAt: -1 });

            const recentMap = {};
            for (const msg of messages) {
                const isMeSender = new RegExp(`^${me}$`, "i").test(msg.sender);
                const contact = isMeSender ? msg.receiver : msg.sender;
                if (!recentMap[contact]) {
                    recentMap[contact] = msg;
                }
            }
            return res.json(recentMap);
        } catch (dbErr) {
            console.warn("[Recent DB Fallback]:", dbErr.message);
        }
    }

    const localList = getLocalMessages();
    const recentMap = {};
    for (let i = localList.length - 1; i >= 0; i--) {
        const msg = localList[i];
        const s = (msg.sender || "").toLowerCase();
        const r = (msg.receiver || "").toLowerCase();
        if (s === me || r === me) {
            const contact = s === me ? msg.receiver : msg.sender;
            if (!recentMap[contact]) {
                recentMap[contact] = msg;
            }
        }
    }
    res.json(recentMap);
});

// Get all messages between current user and a specific receiver
router.get("/:receiver", auth, async (req, res) => {
    const me = (req.user?.username || "").trim().toLowerCase();
    const other = (req.params.receiver || "").trim().toLowerCase();

    if (mongoose.connection.readyState === 1) {
        try {
            const meRegex = new RegExp(`^${me}$`, "i");
            const otherRegex = new RegExp(`^${other}$`, "i");

            const messages = await Message.find({
                $or: [
                    { sender: meRegex, receiver: otherRegex },
                    { sender: otherRegex, receiver: meRegex }
                ]
            }).sort({ createdAt: 1 });
            return res.json(messages);
        } catch (dbErr) {
            console.warn("[Messages DB Fallback]:", dbErr.message);
        }
    }

    const localList = getLocalMessages();
    const filtered = localList.filter((m) => {
        const s = (m.sender || "").toLowerCase();
        const r = (m.receiver || "").toLowerCase();
        return (s === me && r === other) || (s === other && r === me);
    });
    res.json(filtered);
});

// Send message to a specific user
router.post("/", auth, async (req, res) => {
    try {
        const text = (req.body.text || "").trim();
        const receiver = (req.body.receiver || "").trim();
        const sender = req.user?.username || "Member";

        const newMsg = {
            _id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            sender,
            receiver,
            text,
            createdAt: new Date().toISOString()
        };

        if (mongoose.connection.readyState === 1) {
            try {
                const dbMsg = await Message.create({ sender, receiver, text });
                return res.json(dbMsg);
            } catch (dbErr) {
                console.warn("[Send DB Fallback]:", dbErr.message);
            }
        }

        const localList = getLocalMessages();
        localList.push(newMsg);
        saveLocalMessages(localList);

        res.json(newMsg);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
