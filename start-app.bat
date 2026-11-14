@echo off
title Chat App Launcher
echo ========================================================
echo           STARTING REALTIME MERN CHAT APP
echo ========================================================
echo.

:: 1. Check if backend on port 5000 is running
netstat -ano | findstr :5000 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo [1/2] Starting Backend Server (Port 5000)...
    start "Chat Backend Server" cmd /k "cd /d %~dp0backend && node server.js"
    timeout /t 3 /nobreak >nul
) else (
    echo [1/2] Backend Server is already running on port 5000!
)

:: 2. Launch Frontend Dev Server on Port 5173
echo [2/2] Starting Frontend Vite Server (Port 5173)...
start http://localhost:5173
cd /d "%~dp0frontend"
npm run dev
