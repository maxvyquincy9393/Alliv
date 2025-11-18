# 🤝 COLABMATCH (Alliv)

> **A modern platform connecting collaborators for meaningful projects**

COLABMATCH is a comprehensive collaboration platform that helps developers, designers, and creators find the perfect project partners through intelligent matching, real-time chat, and advanced discovery features.

[![CI Status](https://github.com/yourusername/colabmatch/workflows/CI/badge.svg)](https://github.com/yourusername/colabmatch/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
  - [Development Mode](#development-mode)
  - [Docker Mode](#docker-mode)
- [Environment Configuration](#-environment-configuration)
- [Project Structure](#-project-structure)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Security](#-security)
- [License](#-license)

---

## ✨ Features

- 🎯 **Intelligent Matching**: Advanced AI-powered matching algorithm based on skills, interests, and project needs
- 💬 **Real-time Chat**: WebSocket-based instant messaging with online status tracking
- 🌍 **Geolocation Discovery**: Find collaborators nearby with map-based search
- 📸 **Media Upload**: Cloudinary-powered image uploads with automatic optimization
- 🔐 **Secure Authentication**: JWT-based auth with OAuth support (Google, GitHub, X/Twitter)
- 📊 **Analytics Dashboard**: Track profile views, match success rates, and engagement metrics
- 🎨 **Modern UI**: Beautiful, responsive interface built with React and TailwindCSS
- 🔔 **Real-time Notifications**: Stay updated with instant notifications for matches and messages
- ✅ **Identity Verification**: Multi-step verification system with email/SMS support

---

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: MongoDB 7 + Redis
- **Real-time**: Socket.IO for WebSocket connections
- **Authentication**: JWT + OAuth 2.0
- **Task Queue**: RQ (Redis Queue)
- **File Storage**: Cloudinary
- **Monitoring**: Sentry
- **Security**: Rate limiting, CORS, input sanitization

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand + React Query
- **Real-time**: Socket.IO Client
- **Testing**: Vitest + React Testing Library + Playwright
- **Maps**: React Leaflet + Google Maps API

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.x
- **Python** >= 3.11
- **Docker** & **Docker Compose** (for containerized setup)
- **MongoDB** 7.x (if running locally)
- **Redis** 7.x (if running locally)

---

## 🚀 Quick Start

### Development Mode

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/colabmatch.git
cd colabmatch
```

#### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp ../env.example .env
# Edit .env and fill in your configuration

# Generate secure JWT secrets
python generate_secrets.py

# Run the server
uvicorn app.main:socket_app --reload --port 8080
```

#### 3. Seed Demo Users (Recommended)

```bash
# From repo root
python backend/seed_test_users.py
```

- Populates MongoDB with 10+ fully verified demo accounts using Argon2 hashes.
- Run it any time you need a clean set of users (`passwordHash` is regenerated on each run).
- Sample login you can use immediately after seeding:
  - Email: `sarah@demo.com`
  - Password: `Demo123!`

#### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp env.example .env
# Edit .env and fill in your configuration

# Run development server
npm run dev
```

> 💡 Prefer to stay at the repo root? Run `npm run frontend:install`
> (which executes `npm install --prefix frontend`) once to install the
> UI dependencies, then start the Vite dev server any time with `npm run dev`.
> The root script simply proxies to `frontend`'s `npm run dev`, so the same
> `frontend/.env` file and tooling are still used under the hood.

#### 5. Access the application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **API Docs**: http://localhost:8080/docs

---

### Docker Mode

The easiest way to run the entire stack with all services:

```bash
# 1. Setup environment variables
cp env.example .env
cp frontend/env.example frontend/.env
# Edit both .env files with your configuration

# 2. Generate secure secrets (optional but recommended)
python backend/generate_secrets.py

# 3. Start all services
docker-compose up --build

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080/api
# API Docs: http://localhost:8080/docs
```

To run in detached mode:
```bash
docker-compose up -d
```

To stop all services:
```bash
docker-compose down
```

To view logs:
```bash
docker-compose logs -f
```

---

## ⚙️ Environment Configuration

### Required Environment Variables

#### Backend (`backend/.env`)

**Critical Security Variables** (Generate using `python backend/generate_secrets.py`):
- `JWT_ACCESS_SECRET` - JWT access token secret (min 32 chars)
- `JWT_REFRESH_SECRET` - JWT refresh token secret (min 32 chars)
- `REFRESH_TOKEN_FINGERPRINT_PEPPER` - Fingerprint pepper (min 32 chars)

**Database**:
- `MONGO_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `FRONTEND_URL` - Base URL for verification/reset links (defaults to first CORS origin)

**Email Delivery**:
- `SMTP_URL` - SMTP connection string (`smtp://user:pass@host:port`)
- `EMAIL_FROM` - From address for transactional emails

#### Frontend (`frontend/.env`)

**Required**:
- `VITE_API_URL` - Backend API base (must include `/api`, e.g., http://localhost:8080/api)
- `VITE_SOCKET_URL` - WebSocket URL (e.g., http://localhost:8080)

**Optional**:
- `VITE_GOOGLE_MAPS_API_KEY` - For map features
- `VITE_SENTRY_DSN` - For error tracking

See `env.example` files for complete configuration options.

---

## 📁 Project Structure

```
colabmatch/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Security, rate limiting
│   │   ├── integrations/   # Sentry, metrics, CDN
│   │   ├── services/       # Business logic
│   │   ├── models.py       # Database models
│   │   ├── auth.py         # Authentication logic
│   │   └── main.py         # Application entry point
│   ├── tests/              # Backend tests
│   ├── Dockerfile          # Backend container config
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── routes/        # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API clients
│   │   ├── types/         # TypeScript types
│   │   └── config.ts      # Environment configuration
│   ├── tests/             # Frontend tests
│   ├── Dockerfile         # Frontend container config
│   └── package.json       # Node dependencies
│
├── docker-compose.yml      # Multi-container orchestration
├── .github/
│   └── workflows/
│       └── ci.yml         # CI/CD pipeline
├── env.example            # Backend env template
├── frontend/env.example   # Frontend env template
└── README.md              # This file
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/unit/test_auth.py

# Run integration tests
pytest tests/integration/
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e -- --ui
```

> ℹ️ The Playwright suite lives in `frontend/tests/e2e`. Run `npx playwright install` once to download browsers, then `npx playwright test --config=playwright.config.ts`. The config automatically launches the Vite dev server on port `4173`, so ensure the backend API is available locally on `http://localhost:8080/api` (or adjust `VITE_API_URL`) before running the E2E suite.

---

## 🧑‍⚕️ Health & Monitoring

- `GET /health/live` — liveness probe
- `GET /health/ready` — readiness probe (fails if Mongo is unavailable)
- `GET /health` or `GET /api/health` — full JSON payload (database, Redis, system stats, uptime, SMTP config)
- `GET /api/metrics` — Prometheus-compatible metrics

Hook these endpoints into your uptime provider (UptimeRobot, Grafana, Datadog, etc.) and alert when readiness degrades.

---

## 🚢 Deployment

### Option 1: Container Platforms (Recommended)

**Backend**: Deploy to Render, Railway, Fly.io, or DigitalOcean App Platform
- Build: `docker build -t colabmatch-backend ./backend`
- Environment: Set all variables from `env.example`
- Ensure `NODE_ENV=production`

**Frontend**: Deploy to Vercel, Netlify, or Cloudflare Pages
- Build command: `npm run build`
- Output directory: `dist`
- Environment: Set all variables from `frontend/env.example`

### Option 2: VPS Deployment

```bash
# 1. SSH into your VPS
ssh user@your-server.com

# 2. Clone repository
git clone https://github.com/yourusername/colabmatch.git
cd colabmatch

# 3. Setup environment
cp env.example .env
cp frontend/env.example frontend/.env
# Edit .env files with production values

# 4. Deploy with Docker Compose
docker-compose -f docker-compose.yml up -d

# 5. Setup reverse proxy (nginx/Caddy)
# Configure SSL certificates with Let's Encrypt
```

### Environment-specific Notes

**Production Checklist**:
- [ ] Change all default secrets
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS whitelist
- [ ] Enable Sentry monitoring
- [ ] Setup automated backups (MongoDB)
- [ ] Configure rate limiting
- [ ] Run security audit: `npm audit` / `pip-audit`

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run linters**
   ```bash
   # Frontend
   cd frontend && npm run lint

   # Backend
   cd backend && black . && ruff check .
   ```
5. **Run tests**
   ```bash
   # Frontend
   npm test

   # Backend
   pytest
   ```
6. **Commit your changes**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
7. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request**

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

---

## 🔒 Security

### Reporting Vulnerabilities

If you discover a security vulnerability, please email security@alliv.app instead of opening a public issue.

### Security Best Practices

- Never commit `.env` files
- Rotate secrets regularly
- Keep dependencies updated: `npm audit` / `pip-audit`
- Use environment variables for all secrets
- Enable rate limiting in production
- Implement input validation on all endpoints
- Use HTTPS in production
- Enable CORS whitelist

See [SECURITY.md](./SECURITY.md) for detailed security guidelines.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 📞 Support

- **Documentation**: [Full docs](https://docs.alliv.app)
- **Issues**: [GitHub Issues](https://github.com/yourusername/colabmatch/issues)
- **Email**: support@alliv.app

---

## 🙏 Acknowledgments

- FastAPI for the amazing backend framework
- React and Vite for the modern frontend tooling
- MongoDB for flexible data storage
- Cloudinary for media management
- All contributors who help improve this project

---

**Made with ❤️ by the COLABMATCH team**

