# Alliv (formerly ColabMatch)

Professional collaboration platform to discover, connect, and build together. This README is regenerated in UTF-8 for clarity.

## Features
- Discovery (online/nearby) with skills/interests filters
- Swipe/Match flows and real-time chat via Socket.IO
- Projects, events, feed, reports, analytics
- Auth with email/OAuth, email verification, password reset
- File uploads (Cloudinary), maps, i18n, rate limiting, observability hooks

## Tech Stack
- Frontend: React 18 (Vite), TypeScript, Tailwind, Zustand, React Query, Socket.IO client
- Backend: FastAPI, MongoDB, Redis, Socket.IO, Pydantic v2
- Monitoring: Sentry (optional), Prometheus (per-request metrics)

## Quick Start (Dev)
1. `cp env.example .env` and `cp frontend/env.example frontend/.env`
2. Start deps: `docker-compose up -d mongo redis`
3. Backend: `cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:socket_app --reload --port 8080`
4. Frontend: `cd frontend && npm install && npm run dev`
5. Visit frontend http://localhost:5173, backend http://localhost:8080/docs

## Environment (minimum)
- Backend `.env`: `MONGO_URI`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `REFRESH_TOKEN_FINGERPRINT_PEPPER`, `CLOUDINARY_*`, `SMTP_URL`, `CORS_ORIGIN` (prod: explicit domains), `ALLOWED_HOSTS`
- Frontend `.env`: `VITE_API_URL`, `VITE_SOCKET_URL`, optional Sentry/metrics/maps

## Security Defaults
- Cookies HttpOnly for refresh token + CSRF double submit
- Rate limiting via SlowAPI (Redis preferred)
- Trusted hosts + CORS whitelists (no `*` in prod)

## Tests
- Backend: `cd backend && pytest`
- Frontend: `cd frontend && npm test`
- E2E: `cd frontend && npm run test:e2e`

## Deployment Notes
- Use HTTPS only, `NODE_ENV=production`, non-root containers
- Provide readiness/liveness probes: `/health/live`, `/health/ready`
- Configure secrets via secret manager (do not commit .env)

## License
MIT
