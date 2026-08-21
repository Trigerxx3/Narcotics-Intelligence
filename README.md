# Cyber Intelligence Platform 🛡️🔍

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Flask](https://img.shields.io/badge/Backend-Flask%202.3-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2FNeon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

A comprehensive cyber threat intelligence and narcotics investigation platform built for law enforcement and security agencies. It integrates real-time social media monitoring (Telegram, Instagram, WhatsApp), AI-powered NLP content analysis, OSINT (Sherlock, SpiderFoot) capabilities, role-based case management, and automated narcotics report generation.

---

## 🚀 Key Features

- **🌐 Real-Time Social Media Monitoring**: Active channel and keyword scraping across Telegram, Instagram, and WhatsApp.
- **🧠 AI & NLP Content Analysis**: Automated threat/drug keyword detection, intent recognition, risk scoring (0-100), and content flagging.
- **📁 Advanced Case Management**: End-to-end investigation workflow including case requests, admin approval, analyst assignment, target linking, and activity audit logging.
- **🔍 OSINT Integrations**: Integrated Open Source Intelligence tools like Sherlock and SpiderFoot to track digital footprints and aliases across platforms.
- **📊 Interactive Dashboards**: Dark-themed, glassmorphic analytics UI built with Next.js 14, Shadcn/UI, Lucide icons, and Recharts.
- **📑 Automated Narcotics Reports & PDF Export**: Instant generation and preview of official investigation reports with automated export to PDF.
- **🔐 Enterprise Security & Auth**: Role-based access control (Admin / Analyst) with JWT authentication and password hashing.

---

## 🏗️ Architecture & Tech Stack

### **Frontend (`/cyber`)**
- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS + Shadcn UI + Radix Primitives
- **State & Icons**: React Context API + Lucide React
- **Visualization**: Recharts

### **Backend (`/flask_backend`)**
- **Framework**: Python 3.10+ & Flask REST API
- **Database / ORM**: PostgreSQL (Production) / SQLite (Dev) via SQLAlchemy & Flask-Migrate
- **Auth**: Flask-JWT-Extended + Werkzeug Security
- **Data Scraping**: Telethon (Telegram), Playwright/Selenium/Instaloader (Instagram)

### **OSINT & Tools (`/osint_tools`)**
- **OSINT Engines**: Sherlock, SpiderFoot integration

---

## 📁 Repository Structure

```
.
├── cyber/                              # Next.js 14 Frontend Web Application
│   ├── src/                            # App routes, components, hooks & services
│   ├── public/                         # Static assets
│   ├── tailwind.config.ts              # Tailwind CSS configuration
│   └── package.json                    # Frontend dependencies & scripts
│
├── flask_backend/                      # Flask REST API Backend
│   ├── api/                            # API endpoints & route handlers
│   ├── models/                         # SQLAlchemy database models
│   ├── services/                       # Scrapers, NLP, and OSINT logic
│   ├── migrations/                     # Database migrations
│   ├── app.py                          # Application entry point
│   └── requirements.txt                # Python backend dependencies
│
├── osint_tools/                        # OSINT tool integrations (Sherlock, Spiderfoot)
├── PLATFORM_WORKING_GUIDE.md           # Full system operational documentation
├── API_DOCUMENTATION.md                # REST API endpoints reference
└── DEPLOYMENT_COMPLETE_GUIDE.md        # Comprehensive deployment manual
```

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18.0 or higher
- **Python**: v3.10 or higher
- **Git**

---

### 1️⃣ Setting Up the Backend (Flask API)

1. Navigate to the backend directory:
   ```bash
   cd flask_backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables (`.env`):
   ```bash
   cp .env.example .env   # Or create .env
   ```
   Set up your values in `.env`:
   ```env
   FLASK_ENV=development
   SECRET_KEY=your_secret_key_here
   JWT_SECRET_KEY=your_jwt_secret_key_here
   DATABASE_URL=sqlite:///cyber_intel.db
   ```

5. Initialize DB & seed Admin user:
   ```bash
   python seed_admin.py
   ```

6. Run the Flask development server:
   ```bash
   python run.py
   ```
   The backend API will run on `http://localhost:5000`.

---

### 2️⃣ Setting Up the Frontend (Next.js)

1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd cyber
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (`.env.local`):
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:9002` (or `http://localhost:3000`).

---

## 📖 Documentation & Guides

Detailed operational guides are available in the repository:
- 📖 [Platform Working Guide](PLATFORM_WORKING_GUIDE.md): Complete architecture, features, and workflows.
- 🔌 [API Documentation](API_DOCUMENTATION.md): REST API endpoints details.
- 🚀 [Deployment Guide](DEPLOYMENT_COMPLETE_GUIDE.md): Instructions for hosting on Vercel, Render, Railway, and Neon DB.
- 🕵️ [OSINT Tools Guide](OSINT_Tools_Guide.md): Setting up Sherlock and Spiderfoot.

---

## ☁️ Deployment Summary

- **Frontend**: Designed for instant deployment on [Vercel](https://vercel.com).
- **Backend**: Containerized and configured for [Render](https://render.com) (`render.yaml`) or [Railway](https://railway.app) (`railway.toml`).
- **Database**: Managed PostgreSQL on [Neon DB](https://neon.tech) or Railway Postgres.

---

## 👥 User Roles & Access

| Role | Permissions & Capabilities |
| :--- | :--- |
| 🛡️ **Admin** | Full system access, approval of case requests, user/analyst management, system configuration. |
| 🔍 **Analyst** | Case creation, real-time social media scraping, content analysis, entity extraction, OSINT queries, report generation. |

---

## 🤝 Contributing & Support

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This repository is maintained for Cyber Intelligence & Security Operations. All rights reserved.
