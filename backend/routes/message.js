const router = require("express").Router();
const Message = require("../models/message");
const auth = require("../middleware/auth");

// Get most recent message for each conversation
router.get("/conversations/recent", auth, async (req, res) => {
    try {
        const me = (req.user.username || "").trim();
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
        res.json(recentMap);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all messages between current user and a specific receiver
router.get("/:receiver", auth, async (req, res) => {
    try {
        const me = (req.user.username || "").trim();
        const other = (req.params.receiver || "").trim();

        const meRegex = new RegExp(`^${me}$`, "i");
        const otherRegex = new RegExp(`^${other}$`, "i");

        const messages = await Message.find({
            $or: [
                { sender: meRegex, receiver: otherRegex },
                { sender: otherRegex, receiver: meRegex }
            ]
        }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Send message to a specific user
router.post("/", auth, async (req, res) => {
    try {
        const { text, receiver } = req.body;
        const newMessage = await Message.create({
            sender: req.user.username,
            receiver: (receiver || "").trim(),
            text: (text || "").trim(),
        });
        res.json(newMessage);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
