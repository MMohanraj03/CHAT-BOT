require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Disable Mongoose command buffering so queries never hang for 10 seconds if offline
mongoose.set("bufferCommands", false);

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/message", require("./routes/message"));

// socket.io 
const usersocketmap = {};

io.on("connection", (socket) => {
    socket.on("userOnline", (username) => {
        usersocketmap[username] = socket.id;
        io.emit("onlineUser", Object.keys(usersocketmap));
        io.emit("onlineuser", Object.keys(usersocketmap));
    });

    socket.on("sendmessage", (data) => {
        const receiversocketId = usersocketmap[data.receiver];
        if (receiversocketId) {
            io.to(receiversocketId).emit("receivermessage", data);
        }
        socket.emit("receivermessage", data);
    });

    socket.on("disconnect", () => {
        for (const [username, id] of Object.entries(usersocketmap)) {
            if (id === socket.id) {
                delete usersocketmap[username];
                break;
            }
        }
        io.emit("onlineUser", Object.keys(usersocketmap));
        io.emit("onlineuser", Object.keys(usersocketmap));
    });
});

server.listen(5000, () => {
    console.log("Chat Backend Server running on http://localhost:5000");
});

// Connect to Atlas with fallback note
mongoose
    .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 4000 })
    .then(() => console.log("Connected to MongoDB Atlas successfully!"))
    .catch((error) => {
        console.warn("MongoDB Atlas notice: Using high-speed local failover store. (To connect directly, whitelist 0.0.0.0/0 on Atlas Network Access). Error:", error.message);
    });
