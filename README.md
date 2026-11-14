# 💬 Realtime MERN Chat App

A full-stack, real-time messaging application built with **MongoDB Atlas**, **Express.js**, **React 19**, **Node.js**, **Socket.IO**, and **Tailwind CSS**.

Repository: [https://github.com/MMohanraj03/CHAT-BOT](https://github.com/MMohanraj03/CHAT-BOT)

---

## 🚀 Features

- 🔐 **Authentication**: User Registration & Login with JWT and password hashing via `bcryptjs`.
- ⚡ **Realtime Messaging**: Instant bidirectional communication powered by **Socket.IO** (`http://localhost:5000`).
- 🟢 **Live Presence**: Real-time online/offline indicators for all registered users.
- 💬 **Direct Conversations**: One-on-one private messaging with persistent message history stored in MongoDB Atlas.
- 🔔 **In-App Notifications**: Interactive toast alerts and pleasant audio chimes (Web Audio API) when receiving messages from other contacts.
- 📱 **Responsive Design**: WhatsApp / Telegram style aesthetic with split sidebar on desktop and fluid single-view navigation on mobile devices.
- 😊 **Quick Emojis**: Built-in emoji drawer for fast reactions and messages.
- 🔍 **Search & Filters**: Search contacts and filter messages in active conversations.

---

## 🛠️ How to Run

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster or local MongoDB database

### 2. Configure Backend
Copy `backend/.env.example` to `backend/.env` and update your connection string:
```bash
cp backend/.env.example backend/.env
```

### 3. Start Backend Server (Port 5000)
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:5000
```

### 4. Start Frontend App (Port 5173)
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173 in your browser
```

### 5. Or One-Click Launch (Windows)
Double click `start-app.bat` to launch both servers and open your browser automatically.
