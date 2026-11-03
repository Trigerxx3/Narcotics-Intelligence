@echo off
title Cyber Intelligence Platform - Frontend Server
color 0B

echo.
echo ============================================
echo   Cyber Intelligence Platform Frontend
echo ============================================
echo.
echo Starting frontend server on http://localhost:9002...
echo.

cd /d "%~dp0"
npm run dev

echo.
echo Server stopped. Press any key to close...
pause >nul

