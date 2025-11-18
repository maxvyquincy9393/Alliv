# ALLIV Enhanced Features Setup Guide

## Quick Start

This guide will help you set up and test the new collaboration features: Community Feed, AI Insights Panel, Connection Hub, and enhanced onboarding.

## Prerequisites

- Python 3.8+ with pip
- Node.js 16+ with npm
- MongoDB running locally or connection string
- (Optional) OpenAI or Gemini API key for AI features

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Create or update your `.env` file:

```env
# Database
MONGODB_URL=mongodb://localhost:27017/alliv

# AI Services (Optional - will use fallback data if not provided)
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here
AI_SERVICE_PROVIDER=openai

# Feature Flags
ENABLE_AI_INSIGHTS=true
ENABLE_COMMUNITY_FEED=true
ENABLE_CONNECTION_HUB=true

# CORS
CORS_ORIGIN=http://localhost:5173

# Security
JWT_SECRET=your_jwt_secret_here
```

### 3. Database Setup

Create required indexes:

```bash
# Run the server first to initialize collections
python run_server.py

# Then create indexes (in another terminal)
python create_discovery_indexes.py
```

### 4. Seed Sample Data

Generate sample profiles and data for testing:

```bash
# Generate 25 sample profiles with projects, connections, and posts
python seed_sample_profiles.py --env dev --profiles 25

# For more profiles (staging/production testing)
python seed_sample_profiles.py --env staging --profiles 50
```

> Need verified login credentials right away? Run `python backend/seed_test_users.py`
> from the repo root. The script seeds Argon2-hashed demo accounts such as
> `sarah@demo.com` / `Demo123!` and can be re-run whenever you need a fresh set.

### 5. Start Backend Server

```bash
python run_server.py
```

The API will be available at `http://localhost:8000`

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Testing the New Features

### 1. User Registration/Login

**Option A: Use Sample Accounts**
After seeding, you can log in with any of these sample accounts:
- Email: `sarah.chen@example.com` / Password: `password123`
- Email: `alex.rodriguez@example.com` / Password: `password123`
- Email: `michael.kim@example.com` / Password: `password123`

**Option B: Create New Account**
1. Go to `/register`
2. Complete the enhanced onboarding wizard (6 steps)
3. Your preferences will be saved for AI matching

### 2. Community Feed

**Access**: Navigate to `/feed` or click "Feed" in navigation

**Test Features**:
- View different post types (updates, talent requests, events, showcases)
- Filter by type, industry, or trending
- Like, bookmark, and share posts
- Add comments to posts
- Create new posts (click "Create Post" button)

### 3. AI Insights Panel

**Access**: From the main swiping interface, click "AI Insights" button when viewing a user

**Test Features**:
- View compatibility score and match reasons
- See shared and complementary skills
- Review AI-generated project suggestions
- Use conversation starters
- Check availability status
- View suggested actions with priorities

### 4. Connection Hub

**Access**: Navigate to `/connections`

**Test Features**:
- View all connections in grid or list mode
- Filter by status, type, field, or search
- See connection statistics and growth
- View mutual connections
- Export connection data (CSV)
- Manage connection types and notes

### 5. Enhanced Onboarding

**Access**: Available for new user registration

**Test Features**:
- Complete 6-step wizard
- Set skills, collaboration preferences, and work style
- Configure AI matching preferences
- See progress tracking and validation

## API Testing

### Using the API Documentation

1. Start the backend server
2. Visit `http://localhost:8000/docs` for interactive API documentation
3. Use the "Authorize" button to authenticate with JWT token

### Key Endpoints to Test

**Community Feed**:
```bash
# Get feed posts
GET /api/feed?limit=20&filter_type=all

# Create a post
POST /api/feed
{
  "type": "update",
  "content": {
    "text": "Excited to share my latest project!",
    "tags": ["tech", "startup"]
  },
  "visibility": "public"
}

# Engage with a post
POST /api/feed/{post_id}/engage
{
  "action": "like"
}
```

**AI Insights**:
```bash
# Get insights for a user match
GET /api/insights/matches/{user_id}

# Get project recommendations
GET /api/insights/project-recommendations?limit=5
```

**Connections**:
```bash
# Get connections
GET /api/connections?limit=50&sort_by=recent

# Create connection
POST /api/connections
{
  "user_id": "user_id_here",
  "connection_type": "collaborator",
  "notes": "Great designer to work with"
}

# Get connection stats
GET /api/connections/stats
```

## Troubleshooting

### Common Issues

**1. Database Connection Error**
```
Error: Failed to connect to MongoDB
```
**Solution**: Ensure MongoDB is running and the connection string is correct in `.env`

**2. AI Insights Not Working**
```
Error: Failed to generate insights
```
**Solution**: AI insights will use fallback mock data if API keys are not configured. This is normal for development.

**3. Seeding Script Fails**
```
Error: Collection not found
```
**Solution**: Start the backend server first to initialize collections, then run the seeding script.

**4. CORS Errors**
```
Error: CORS policy blocked
```
**Solution**: Ensure `CORS_ORIGIN` in backend `.env` matches your frontend URL (usually `http://localhost:5173`)

### Performance Tips

**For Development**:
- Use smaller datasets (25 profiles) for faster loading
- Enable only necessary features in environment variables
- Use local MongoDB for better performance

**For Production**:
- Configure proper database indexes
- Set up Redis for caching (optional)
- Use environment-specific configurations

## Feature Configuration

### Disabling Features

You can disable specific features by setting environment variables:

```env
ENABLE_AI_INSIGHTS=false
ENABLE_COMMUNITY_FEED=false  
ENABLE_CONNECTION_HUB=false
```

### AI Service Configuration

**OpenAI Setup**:
```env
AI_SERVICE_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

**Gemini Setup**:
```env
AI_SERVICE_PROVIDER=gemini
GEMINI_API_KEY=...
```

**Fallback Mode** (No API Key):
The system will use deterministic algorithms and mock data for AI features.

## Development Workflow

### Making Changes

1. **Backend Changes**: Modify files in `backend/app/`, server auto-reloads
2. **Frontend Changes**: Modify files in `frontend/src/`, Vite auto-reloads
3. **Database Changes**: Update models in `backend/app/models_enhanced.py`

### Testing New Features

1. Use the seeded sample data for consistent testing
2. Check browser console for any errors
3. Monitor backend logs for API issues
4. Use the API documentation for endpoint testing

### Adding New Data

```bash
# Add more sample data
python seed_sample_profiles.py --env dev --profiles 10

# Clear and regenerate all data
python seed_sample_profiles.py --env dev --profiles 25 --clear
```

## Next Steps

1. **Explore the Features**: Try all the new functionality with sample data
2. **Customize**: Modify components and APIs to fit your needs
3. **Integrate**: Add the features to your existing workflows
4. **Scale**: Configure for production deployment

## Support

- Check `FEATURE_IMPLEMENTATION.md` for detailed technical documentation
- Review API documentation at `/docs` endpoint
- Monitor logs for debugging information
- Use sample data for consistent testing scenarios

Happy collaborating with ALLIV! 🚀

