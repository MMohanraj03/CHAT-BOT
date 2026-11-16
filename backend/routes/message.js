const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { PrivateMessage, Message } = require("../models/message");
const auth = require("../middleware/auth");

const LOCAL_MSGS_FILE = path.join(__dirname, "../local_messages.json");
const GITHUB_REPO = "MMohanraj03/NEZUKO_01";
const BRANCH = "data-storage";
const FILE_PATH = "private_chat.json";
const GITHUB_TOKEN =
    process.env.GITHUB_TOKEN ||
    process.env.VITE_GITHUB_TOKEN ||
    "";

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

// Fetch all messages from GitHub cloud storage
async function fetchGitHubMessages() {
    try {
        const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${BRANCH}&t=${Date.now()}`;
        const res = await fetch(url, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                "User-Agent": "chat-app-backend",
                Accept: "application/vnd.github.v3+json"
            }
        });
        if (res.ok) {
            const data = await res.json();
            const content = Buffer.from(data.content, "base64").toString("utf-8");
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                return { list: parsed, sha: data.sha };
            }
        }
    } catch (e) {
        console.warn("[GitHub Fetch Note]:", e.message);
    }
    return { list: [], sha: null };
}

// Sync message to GitHub Cloud Database
async function syncMessageToGitHub(newMsg) {
    try {
        const { list, sha } = await fetchGitHubMessages();
        if (!sha) return;

        const exists = list.some((m) => m.id === newMsg.id || (m._id === newMsg._id));
        if (exists) return;

        const updated = [...list, newMsg].slice(-1000);
        const body = {
            message: `sync: save message from ${newMsg.sender} to ${newMsg.receiver}`,
            content: Buffer.from(JSON.stringify(updated, null, 2)).toString("base64"),
            branch: BRANCH,
            sha
        };

        const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
        await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                "User-Agent": "chat-app-backend",
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
    } catch (e) {
        console.warn("[GitHub Sync Note]:", e.message);
    }
}

// Helper: load unified messages from Atlas, GitHub, and Local
async function loadUnifiedMessages() {
    const map = new Map();

    // 1. Local disk cache
    getLocalMessages().forEach((m) => {
        const id = m.id || m._id || `${m.sender}-${m.receiver}-${m.createdAt}`;
        map.set(id, m);
    });

    // 2. GitHub cloud database
    try {
        const { list: ghList } = await fetchGitHubMessages();
        ghList.forEach((m) => {
            const id = m.id || m._id || `${m.sender}-${m.receiver}-${m.createdAt}`;
            map.set(id, m);
        });
    } catch {}

    // 3. MongoDB Atlas (if connected)
    if (mongoose.connection.readyState === 1) {
        try {
            const atlasMsgs = await PrivateMessage.find().sort({ createdAt: 1 }).lean();
            atlasMsgs.forEach((m) => {
                const id = m.id || String(m._id);
                map.set(id, {
                    _id: id,
                    id: m.id || id,
                    sender: m.sender,
                    receiver: m.receiver,
                    text: m.text,
                    image: m.image || "",
                    audio: m.audio || "",
                    replyTo: m.replyTo || null,
                    reactions: m.reactions || {},
                    createdAt: m.createdAt,
                    timestamp: m.timestamp
                });
            });
        } catch (dbErr) {
            console.warn("[MongoDB Query Note]:", dbErr.message);
        }
    }

    return Array.from(map.values()).sort((a, b) => {
        const tA = new Date(a.createdAt || 0).getTime() || Number(a.createdAt) || 0;
        const tB = new Date(b.createdAt || 0).getTime() || Number(b.createdAt) || 0;
        return tA - tB;
    });
}

// Get most recent message for each conversation
router.get("/conversations/recent", auth, async (req, res) => {
    const me = (req.user?.username || "").trim().toLowerCase();
    const all = await loadUnifiedMessages();

    const recentMap = {};
    for (let i = all.length - 1; i >= 0; i--) {
        const msg = all[i];
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
    const all = await loadUnifiedMessages();

    const conversation = all.filter((m) => {
        const s = (m.sender || "").toLowerCase();
        const r = (m.receiver || "").toLowerCase();
        return (s === me && r === other) || (s === other && r === me);
    });

    res.json(conversation);
});

// Send message
router.post("/", auth, async (req, res) => {
    try {
        const text = (req.body.text || "").trim();
        const receiver = (req.body.receiver || "").trim();
        const sender = req.user?.username || req.body.sender || "Member";
        const image = req.body.image || "";
        const audio = req.body.audio || "";
        const replyTo = req.body.replyTo || null;

        if (!receiver || (!text && !image && !audio)) {
            return res.status(400).json({ error: "Receiver and content required" });
        }

        const msgId = `pmsg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const nowTs = Date.now();

        const newMsg = {
            _id: msgId,
            id: msgId,
            sender,
            receiver,
            text,
            image,
            audio,
            replyTo,
            reactions: {},
            avatar: "/logo_eye.jpg",
            timestamp,
            read: false,
            createdAt: nowTs
        };

        // 1. Save locally immediately
        const localList = getLocalMessages();
        localList.push(newMsg);
        saveLocalMessages(localList);

        // 2. Save to MongoDB Atlas (both collections)
        if (mongoose.connection.readyState === 1) {
            try {
                await PrivateMessage.findOneAndUpdate(
                    { id: msgId },
                    { $set: newMsg },
                    { upsert: true }
                );
                await Message.findOneAndUpdate(
                    { id: msgId },
                    { $set: { ...newMsg, createdAt: new Date(nowTs) } },
                    { upsert: true }
                );
            } catch (dbErr) {
                console.warn("[MongoDB Save Note]:", dbErr.message);
            }
        }

        // 3. Central Cloud Database Sync (GitHub & Nezuko Vercel API)
        syncMessageToGitHub(newMsg);

        try {
            fetch("https://nezuko-01.vercel.app/api/message", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user": sender
                },
                body: JSON.stringify({ sender, receiver, text, image, audio, replyTo })
            }).catch(() => {});
        } catch {}

        res.json(newMsg);
    } catch (err) {
        console.error("SEND ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
