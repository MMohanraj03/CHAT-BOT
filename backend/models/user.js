const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, index: true },
        password: { type: String, default: "pearlbee" },
        avatar: { type: String, default: "/logo_eye.jpg" },
        lastActive: { type: Date, default: Date.now }
    },
    { timestamps: true, strict: false }
);

const User = mongoose.model("User", userSchema, "users");
const ChatUser = mongoose.model("ChatUser", userSchema, "chatusers");

module.exports = { User, ChatUser };
