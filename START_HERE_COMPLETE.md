# 🚀 ALLIV - Quick Start Guide

## Prerequisites Installed ✅
- MongoDB (Docker container running on port 27017)
- Python 3.12 with all dependencies (argon2-cffi, FastAPI, Motor, etc.)
- Node.js with React frontend ready

---

## Step 1: Start Backend API

Open **Terminal 1** (PowerShell):

```powershell
cd C:\Users\test\OneDrive\Desktop\COLABMATCH\backend
python -m uvicorn app.main:app --reload --port 8000
```

Wait for:
```
✅ Database connected
INFO: Application startup complete.
INFO: Uvicorn running on http://127.0.0.1:8000
```

Test health: http://localhost:8000/health
API Docs: http://localhost:8000/docs

---

## Step 2: Start Frontend

Open **Terminal 2** (PowerShell):

```powershell
cd C:\Users\test\OneDrive\Desktop\COLABMATCH\frontend
npm run dev
```

Wait for:
```
VITE v7.x.x ready in xxx ms
➜ Local: http://localhost:5173/
```

Open browser: http://localhost:5173

---

## Step 3: Test Complete Flow

### A. User Registration
1. Go to http://localhost:5173/register
2. Accept House Rules
3. Choose "Email" option
4. Fill: Name, Email, Password, Birthdate
5. Upload 1-6 photos
6. Select category (Developer/Designer/etc.)
7. Add bio + goals
8. Select 5 skills max
9. Select 7 interests max
10. Enable location
11. Review & Submit

### B. Email Verification (Backend Logs)
```powershell
# In backend terminal, you'll see:
📧 Sending verification email to: your@email.com
🔢 Verification code: 123456
```

Send verification request:
```powershell
curl -X POST http://localhost:8000/auth/verify/request `
  -H "Content-Type: application/json" `
  -d '{"channel":"email","destination":"your@email.com"}'
```

Confirm with OTP:
```powershell
curl -X POST http://localhost:8000/auth/verify/confirm `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" `
  -d '{"code":"123456"}'
```

### C. Login
```powershell
curl -X POST http://localhost:8000/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"your@email.com","password":"YourPassword123!"}'
```

Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### D. Get Profile
```powershell
curl http://localhost:8000/me `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### E. Update Profile
```powershell
curl -X PUT http://localhost:8000/me `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "bio": "Passionate developer",
    "field": "Developer",
    "skills": ["React", "Python", "Node.js"],
    "interests": ["AI", "Web3", "Startups"],
    "location": {
      "city": "Jakarta",
      "country": "Indonesia",
      "lat": -6.2088,
      "lon": 106.8456,
      "hideExact": false
    }
  }'
```

### F. Upload Photos
```powershell
curl -X PUT http://localhost:8000/me/photos `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "photos": [
      "https://res.cloudinary.com/dvlqelnsf/image/upload/v1/photo1.jpg",
      "https://res.cloudinary.com/dvlqelnsf/image/upload/v1/photo2.jpg"
    ]
  }'
```

### G. View Public Profile
```powershell
curl http://localhost:8000/profiles/USER_ID_HERE
```

---

## Features Checklist

### ✅ Implemented (MVP Core)
1. **Onboarding**:
   - ✅ Welcome Screen with logo
   - ✅ House Rules Modal (4 rules + checkbox)
   - ✅ Account Creation (email/password/name/birthdate)
   - ✅ Photo Upload (6 slots, drag-drop, 1MB compress)
   - ✅ Basic Info (category selector)
   - ✅ Skills Selector (5 max)
   - ✅ Interests Grid (7 max)
   - ✅ Profile Summary preview

2. **Authentication**:
   - ✅ Register endpoint (POST /auth/register)
   - ✅ Login endpoint (POST /auth/login)
   - ✅ OTP Email Verification (POST /auth/verify/request + confirm)
   - ✅ JWT Token Management (access + refresh)
   - ✅ OAuth URLs (Google/GitHub/X)

3. **Profile Management**:
   - ✅ Get Profile (GET /me)
   - ✅ Update Profile (PUT /me)
   - ✅ Update Photos (PUT /me/photos)
   - ✅ View Public Profile (GET /profiles/:id)
   - ✅ Privacy Controls (hideExact location)

4. **Discovery**:
   - ✅ Swipe Deck UI (Tinder-style cards)
   - ✅ Online/Nearby toggle
   - ✅ Filters (distance, skills)

5. **Chat**:
   - ✅ Chat UI (iMessage style)
   - ✅ Message sending/receiving
   - ✅ AI Icebreakers

### ⏳ Missing (To Be Implemented)
1. **Discovery Enhancement**:
   - ⏳ Maps View for Nearby (Google Maps integration)
   - ⏳ AI Matching Score (skills + interests + location)
   - ⏳ Super Connect (highlight top matches)
   - ⏳ Rewind Action (undo swipes)

2. **Matching**:
   - ⏳ Swipe Actions API (skip/save/connect)
   - ⏳ Mutual Match Detection
   - ⏳ Matches Dashboard

3. **Chat Enhancement**:
   - ⏳ File/Portfolio Share
   - ⏳ Voice Notes
   - ⏳ Video Call
   - ⏳ Group Chat
   - ⏳ Flirt Detector (AI sentiment)

4. **Collaboration**:
   - ⏳ Events Creator
   - ⏳ Project Board
   - ⏳ AI Daily Recommendations

5. **Trust & Safety**:
   - ⏳ Trust Score (0-100)
   - ⏳ Verification Badge
   - ⏳ Advanced Reporting
   - ⏳ Privacy Toggles

6. **Monetization**:
   - ⏳ Project Boost ($0.99)
   - ⏳ IAP Boosts (Stripe)
   - ⏳ Ads Subtle (AdMob)
   - ⏳ Affiliate Links

7. **Analytics**:
   - ⏳ Personal Analytics Dashboard
   - ⏳ Notifications Hub

---

## Troubleshooting

### Backend Won't Start
- Ensure MongoDB is running: `docker ps | Select-String "alliv-mongo"`
- Check port 8000: `Get-Process | Where-Object {$_.ProcessName -eq 'python'}`
- Install missing packages: `pip install -r requirements.txt`

### Frontend Won't Start
- Check Node version: `node --version` (need 18+)
- Reinstall: `cd frontend; rm -rf node_modules; npm install --legacy-peer-deps`

### Database Connection Errors
- MongoDB not running → Start: `docker start alliv-mongo`
- Port conflict → Change MONGO_URI in .env

### Authentication Errors
- Token expired → Login again
- JWT secret mismatch → Check .env JWT_ACCESS_SECRET

---

## Next Implementation Priority

Based on user request for **Maps View for Nearby**:

1. **CREATE**: `frontend/src/components/MapsView.tsx`
   - Google Maps integration
   - Marker clustering
   - User location markers
   - Distance display

2. **UPDATE**: `frontend/src/routes/Discover.tsx`
   - Add Maps/Cards toggle
   - Integrate MapsView component

3. **CREATE**: `backend/app/routes/discovery.py`
   - Enhanced geolocation queries
   - Haversine distance calculation
   - Compatibility scoring algorithm

4. **UPDATE**: Backend main.py
   - Register discovery router

5. **FIX**: All integration errors
   - CORS issues
   - API endpoint mismatches
   - Type errors in frontend

**Estimated Time**: 2-3 hours for complete Maps + Discovery integration

---

## API Endpoints Summary

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - End session
- `POST /auth/refresh` - Refresh access token
- `GET /auth/oauth/{provider}/url` - Get OAuth URL
- `GET /auth/oauth/{provider}/callback` - OAuth callback
- `POST /auth/verify/request` - Send OTP
- `POST /auth/verify/confirm` - Verify OTP

### Profile
- `GET /me` - Get current user profile
- `PUT /me` - Update profile
- `PUT /me/photos` - Update photos
- `GET /profiles/{userId}` - Get public profile

### Discovery (Old - Need Update)
- `GET /discover/next` - Get candidates

### Matching (Old - Need Update)
- `POST /match/like/{userId}` - Like user
- `POST /match/pass/{userId}` - Pass user
- `GET /match/list` - List matches

### Chat (Old - Need Update)
- `GET /chat/{matchId}/messages` - Get messages
- `POST /chat/{matchId}/messages` - Send message

---

## Environment Variables

### Backend (.env)
```env
MONGO_URI=mongodb://localhost:27017/alliv
JWT_ACCESS_SECRET=your_secret_here
MAPS_API_KEY=a7e93e599ee24103bf45454d509569bb
CLOUDINARY_CLOUD_NAME=dvlqelnsf
SMTP_URL=smtp://77b03db33ff0bb:7aa15f98c4ef9d@sandbox.smtp.mailtrap.io:587
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
VITE_MAPS_API_KEY=a7e93e599ee24103bf45454d509569bb
VITE_CLOUDINARY_CLOUD_NAME=dvlqelnsf
```

---

## Database Collections

- `users` - User accounts (email, passwordHash, verified)
- `profiles` - User profiles (bio, skills, interests, location)
- `swipes` - Swipe actions (skip/save/connect)
- `matches` - Mutual connections
- `chats` - Chat sessions
- `messages` - Chat messages
- `projects` - Collaboration projects
- `events` - Meetup events
- `verifications` - OTP codes
- `reports` - Safety reports
- `blocks` - Blocked users

---

🚀 **Ready to start!** Run backend + frontend in separate terminals, then test the complete flow.
