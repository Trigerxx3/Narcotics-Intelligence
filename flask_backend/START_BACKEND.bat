@echo off
title Cyber Intelligence Platform - Backend Server
color 0A

echo.
echo ============================================
echo   Cyber Intelligence Platform Backend
echo ============================================
echo.
echo 🚀 Starting backend server...
echo.

cd /d "%~dp0"

REM Kill any existing Python processes
taskkill /F /IM python.exe 2>nul

REM Start the server
python start_server.py

echo.
echo ❌ Server stopped. Press any key to close...
pause >nul
