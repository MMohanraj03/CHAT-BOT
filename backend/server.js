require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
// exports.app = app;
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
})

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/message", require("./routes/message"));

//socket.io 
const usersocketmap = {};

io.on("connection", (socket) => {
    console.log("user connected", socket.id);
    socket.on("userOnline", (username) => {
        usersocketmap[username] = socket.id;
        io.emit("onlineUser", Object.keys(usersocketmap));
    })
    socket.on("sendmessage", (data) => {
        const receiversocketId = usersocketmap[data.receiver];
        if (receiversocketId) {
            io.to(receiversocketId).emit("receivermessage", data);
        }
        socket.emit("receivermessage", data);
    })
    socket.on("disconnect", () => {
        for (const [username, id] of Object.entries(usersocketmap)) {
            if (id === socket.id) {
                delete usersocketmap[username];
                break;
            }
        }
        io.emit("onlineUser", Object.keys(usersocketmap));
        io.emit("onlineuser", Object.keys(usersocketmap));
    })
})

mongoose
    .connect(process.env.MONGO_URI)
    .then(() =>
        server.listen(5000, () => console.log("Server running on port 5000"))).catch((error) => console.error(error));