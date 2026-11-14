const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://mohanmpa2_db_user:pw7hsGWI556WTsfC@chat-app.x3zg8lh.mongodb.net/?compressors=zlib";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30";

process.env.MONGO_URI = MONGO_URI;
process.env.JWT_SECRET = JWT_SECRET;

let isConnected = false;
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
  } catch (err) {
    console.error("[Vite/Vercel Serverless] MongoDB error:", err.message);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use("/api/auth", require("../backend/routes/auth"));
app.use("/api/message", require("../backend/routes/message"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

module.exports = app;
