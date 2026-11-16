const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        id: { type: String },
        sender: { type: String, required: true, index: true },
        receiver: { type: String, required: true, index: true },
        text: { type: String, default: "" },
        image: { type: String, default: "" },
        audio: { type: String, default: "" },
        replyTo: { type: mongoose.Schema.Types.Mixed, default: null },
        reactions: { type: mongoose.Schema.Types.Mixed, default: {} },
        avatar: { type: String, default: "/logo_eye.jpg" },
        timestamp: { type: String },
        read: { type: Boolean, default: false },
        createdAt: { type: mongoose.Schema.Types.Mixed, default: () => Date.now(), index: true },
    },
    { timestamps: true, strict: false, collection: "privatemessages" }
);

// Exports model mapped to 'privatemessages' collection (matching nezuko_chat)
const PrivateMessage = mongoose.model("PrivateMessage", messageSchema, "privatemessages");
const Message = mongoose.model("Message", messageSchema, "messages");

module.exports = { PrivateMessage, Message };
