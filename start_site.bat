@echo off
title Cyber Intelligence Platform Launcher
color 0B

echo ========================================================
echo    Starting Cyber Intelligence Platform
echo ========================================================
echo.
echo [1/2] Starting Flask Backend (port 5000)...
start "Cyber Platform - Backend (Flask)" cmd /k "cd /d "%~dp0flask_backend" && python run.py"

echo [2/2] Starting Next.js Frontend (port 9002)...
start "Cyber Platform - Frontend (Next.js)" cmd /k "cd /d "%~dp0cyber" && npm run dev"

echo.
echo ========================================================
echo   Services are running!
echo.
echo   Frontend : http://localhost:9002
echo   Backend  : http://127.0.0.1:5000
echo   Health   : http://127.0.0.1:5000/api/health
echo.
echo   Default Admin Credentials:
echo     Email    : admin@cyber.com
echo     Password : admin123456
echo ========================================================
echo.
pause

