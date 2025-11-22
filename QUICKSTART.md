# ⚡ COLABMATCH - Quick Start Guide

Get COLABMATCH up and running in **5 minutes**!

---

## 🎯 Choose Your Path

### Option 1: Docker (Recommended) 🐳

**Perfect for: Quick testing, production-like environment**

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/colabmatch.git
cd colabmatch

# 2. Create environment files
cp env.example .env
cp frontend/env.example frontend/.env

# 3. Generate secure secrets
python backend/generate_secrets.py

# 4. Start everything
docker-compose up

# 5. Access the app
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
# API Docs: http://localhost:8080/docs
```

That's it! 🎉

---

### Option 2: Local Development 💻

**Perfect for: Active development, debugging**

#### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB 7+
- Redis 7+

#### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/colabmatch.git
cd colabmatch

# 2. Run automated setup (Linux/Mac)
bash scripts/setup-dev.sh

# Or on Windows
scripts\setup-dev.bat

# 3. Start MongoDB & Redis (if using Docker)
docker-compose up -d mongo redis

# 4. Start Backend (Terminal 1)
cd backend
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uvicorn app.main:socket_app --reload --port 8080

# 5. Start Frontend (Terminal 2)
cd frontend
npm run dev

# 6. Access the app
# Frontend: http://localhost:5173
# Backend:  http://localhost:8080
# API Docs: http://localhost:8080/docs
```

---

### Option 3: Using Makefile 🛠️

**Perfect for: Frequent developers**

```bash
# 1. Clone and setup
git clone https://github.com/yourusername/colabmatch.git
cd colabmatch
make setup

# 2. Start databases
make db-start

# 3. Start services (2 terminals)
# Terminal 1:
make dev-backend

# Terminal 2:
make dev-frontend

# View all available commands
make help
```

---

## 🔑 Environment Configuration

### Minimal Required Configuration

#### Backend `.env`:
```bash
# Database (use Docker or your own)
MONGO_URI=mongodb://localhost:27017/alliv
REDIS_URL=redis://localhost:6379

# Security (REQUIRED - generate with: python backend/generate_secrets.py)
JWT_ACCESS_SECRET=<your-generated-secret>
JWT_REFRESH_SECRET=<your-generated-secret>
REFRESH_TOKEN_FINGERPRINT_PEPPER=<your-generated-secret>
```

#### Frontend `.env`:
```bash
VITE_API_URL=http://localhost:8080
VITE_SOCKET_URL=http://localhost:8080
```

---

## ✅ Verify Installation

### Check Backend Health
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-...",
  "checks": { ... }
}
```

### Check Frontend
Open http://localhost:5173 (dev) or http://localhost:3000 (docker)

You should see the COLABMATCH landing page.

---

## 🧪 Run Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# E2E tests
cd frontend
npm run test:e2e
```

---

## 🎨 Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/amazing-feature
```

### 2. Make Changes
Edit code, add features, fix bugs...

### 3. Test & Lint
```bash
# Backend
cd backend
black .
pytest

# Frontend
cd frontend
npm run lint
npm test
```

### 4. Commit & Push
```bash
git add .
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
```

### 5. Create Pull Request
Open PR on GitHub for review.

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change ports in docker-compose.yml or .env
# Backend: PORT=8081
# Frontend: Change Vite config
```

### Database Connection Failed
```bash
# Check if MongoDB is running
docker-compose ps mongo

# Or restart
docker-compose restart mongo
```

### Module Not Found
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
rm -rf node_modules
npm install
```

### Permission Denied (Linux/Mac)
```bash
chmod +x scripts/*.sh
```

---

## 📚 Next Steps

Once you have the app running:

1. **Explore the API**: http://localhost:8080/docs
2. **Read the Documentation**: [README.md](README.md)
3. **Check Security Guidelines**: [SECURITY.md](SECURITY.md)
4. **Read Contributing Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)
5. **Join the Community**: [GitHub Discussions](https://github.com/yourusername/colabmatch/discussions)

---

## 🚀 Deploy to Production

Ready to deploy? See deployment guides:

- [Vercel](https://vercel.com/) - Frontend
- [Render](https://render.com/) - Backend
- [Railway](https://railway.app/) - Full stack
- [DigitalOcean](https://www.digitalocean.com/) - VPS

See [README.md](README.md#-deployment) for detailed instructions.

---

## 💬 Get Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/colabmatch/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/colabmatch/discussions)
- **Email**: support@alliv.app

---

## 📝 Common Commands

```bash
# Development
make dev-backend          # Start backend
make dev-frontend         # Start frontend
make test                 # Run all tests
make lint                 # Lint code
make format               # Format code

# Docker
make docker-up            # Start all services
make docker-down          # Stop all services
make docker-logs          # View logs

# Database
make db-start             # Start MongoDB & Redis
make db-stop              # Stop databases

# Utilities
make clean                # Clean build artifacts
make security-check       # Run security audit
make generate-secrets     # Generate JWT secrets
make help                 # Show all commands
```

---

**Happy Coding! 🎉**

Need more details? Check the [full README](README.md).






