# Alliv Backend API

Professional collaboration platform API built with FastAPI, MongoDB, Redis, and Socket.IO.

## 🚀 Features

- **Authentication**
  - Email/Password with argon2 hashing
  - OAuth (Google, GitHub, X/Twitter)
  - JWT access + refresh token rotation
  - Email/Phone OTP verification (mock mode supported)

- **Discovery**
  - Online mode: Browse all active users
  - Nearby mode: Geolocation-based discovery (Haversine algorithm)
  - Advanced filters: field, skills, interests, vibe
  - Compatibility scoring (45% skills + 35% interests + 10% activity + 10% proximity)

- **Matching**
  - Swipe actions: skip, save, connect
  - Mutual match detection
  - Real-time match notifications

- **Chat**
  - WebSocket-based real-time messaging
  - Socket.IO integration
  - Typing indicators
  - Read receipts
  - File attachments

- **Collaboration**
  - Projects: Create, browse, apply, invite
  - Events: Create, browse, RSVP
  - Team collaboration features

- **Safety & Moderation**
  - Report system (harassment, spam, NSFW, etc.)
  - Block users
  - Trust score system
  - Content moderation hooks

- **Infrastructure**
  - Rate limiting (SlowAPI)
  - Request logging
  - CORS configuration
  - Compression middleware
  - Health check endpoints
  - OpenAPI/Swagger documentation

## 📦 Tech Stack

- **Framework**: FastAPI 0.109.0
- **Database**: MongoDB (Motor async driver)
- **Cache**: Redis
- **WebSocket**: Python-SocketIO
- **Authentication**: python-jose, argon2-cffi, authlib
- **File Upload**: Cloudinary
- **Validation**: Pydantic v2
- **Testing**: pytest, pytest-asyncio

## 🛠️ Quick Start

### Prerequisites

- Python 3.11+
- MongoDB 6.0+
- Redis 7.0+

### Installation

1. **Clone and navigate to backend**:
```bash
cd backend
```

2. **Create virtual environment**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Run the server**:
```bash
uvicorn app.main:app --reload --port 8080
```

The API will be available at `http://localhost:8080`

### With Docker

```bash
docker-compose up -d
```

## 📝 Environment Variables

See `.env.example` for all available configuration options:

```bash
# Application
NODE_ENV=development
PORT=8080
CORS_ORIGIN=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/alliv
REDIS_URL=redis://localhost:6379

# JWT (generate secure random keys)
JWT_ACCESS_SECRET=<base64-48-bytes-min>
JWT_REFRESH_SECRET=<base64-96-bytes-min>
REFRESH_TOKEN_FINGERPRINT_PEPPER=<base64-32-bytes>

# OAuth
OAUTH_GOOGLE_ID=your_google_client_id
OAUTH_GOOGLE_SECRET=your_google_client_secret
# ... (see .env.example for full list)

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📚 API Documentation

### Interactive Docs

- **Swagger UI**: http://localhost:8080/docs
- **ReDoc**: http://localhost:8080/redoc

### Main Endpoints

#### Authentication
- `POST /auth/register` - Register with email/password
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout
- `GET /auth/oauth/{provider}/url` - Get OAuth authorization URL
- `GET /auth/oauth/{provider}/callback` - OAuth callback
- `POST /auth/verify/request` - Request OTP verification
- `POST /auth/verify/confirm` - Confirm OTP code

#### Profile
- `GET /me` - Get current user profile
- `PUT /me` - Update profile
- `PUT /me/photos` - Upload photos
- `GET /profiles/{id}` - Get user profile

#### Discovery
- `GET /discover/online` - Browse online users
- `GET /discover/nearby` - Find nearby users (geolocation)

Query params: `field`, `skills`, `interests`, `vibe`, `limit`, `cursor`

#### Swipes & Matches
- `POST /swipes` - Swipe action (skip/save/connect)
- `GET /matches` - List matches
- `GET /matches/{id}` - Get match details
- `POST /matches/{id}/open-chat` - Open chat with match

#### Chat
- `GET /chats` - List conversations
- `GET /chats/{id}/messages` - Get messages
- `POST /chats/{id}/messages` - Send message

#### WebSocket (Socket.IO)

**Namespace**: `/ws/chat`

**Events**:
- `chat.join` - Join chat room
- `chat.leave` - Leave chat room
- `message.send` - Send message
- `message.typing` - Typing indicator
- `message.read` - Mark as read

#### Projects & Events
- `POST /projects` - Create project
- `GET /projects` - List projects
- `POST /projects/{id}/apply` - Apply to project
- `POST /events` - Create event
- `GET /events` - List events
- `POST /events/{id}/rsvp` - RSVP to event

#### Safety
- `POST /reports` - Report user
- `POST /blocks` - Block user

## 🗂️ Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app + middleware
│   ├── config.py            # Settings (pydantic-settings)
│   ├── db.py                # MongoDB connection
│   ├── models.py            # Pydantic models
│   ├── security.py          # Auth utilities
│   ├── routes/              # API endpoints
│   │   ├── auth.py          # Authentication
│   │   ├── discover.py      # Discovery
│   │   ├── match.py         # Swipes & Matches
│   │   └── chat.py          # Chat
│   ├── websocket.py         # Socket.IO handlers
│   └── seed.py              # Database seeding
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## 🧪 Testing

Run tests:
```bash
pytest
```

With coverage:
```bash
pytest --cov=app --cov-report=html
```

## 🌱 Seed Data

Populate database with sample data:

```bash
python -m app.seed
```

This creates:
- 60+ diverse user profiles
- Various skills/interests combinations
- Sample projects and events
- Mock chat messages

## 🔒 Security

- **Password Hashing**: argon2id (OWASP recommended)
- **JWT**: Rotating access/refresh tokens with fingerprinting
- **Rate Limiting**: 100 requests per 60 seconds (configurable)
- **CORS**: Strict origin validation
- **Input Validation**: Pydantic models for all requests
- **Privacy**: Location obfuscation option (hideExact flag)

## 🚢 Deployment

### Docker Production Build

```bash
docker build -t alliv-api .
docker run -p 8080:8080 --env-file .env alliv-api
```

### Environment Checklist

Before deploying:
- [ ] Change all secrets in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `CORS_ORIGIN`
- [ ] Set up MongoDB with authentication
- [ ] Set up Redis persistence
- [ ] Configure OAuth credentials
- [ ] Set up Cloudinary account
- [ ] Configure email/SMS provider
- [ ] Enable rate limiting
- [ ] Set up monitoring/logging

## 📊 Matching Algorithm

Compatibility score calculation:

```
score = round(
    0.45 * jaccard_similarity(skills) +
    0.35 * jaccard_similarity(interests) +
    0.10 * activity_score +
    0.10 * proximity_score(distance)
) * 100
```

- **High Compatibility**: score ≥ 70%
- **Proximity**: 1.0 at 0-2km, linear decay to 0 at >50km
- **Activity**: Based on recent activity and response rate

## 🤝 Contributing

1. Follow PEP 8 style guide
2. Add tests for new features
3. Update documentation
4. Run `black` and `ruff` before committing

## 📄 License

Proprietary - Alliv Platform

## 🆘 Support

For issues and questions:
- Check `/docs` for API reference
- Review logs for errors
- Contact: dev@alliv.app
