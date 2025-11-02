# ✅ ALLIV - Complete System Testing Checklist

## 🎯 Testing Flow

### Phase 1: Backend Setup & Health Check

**1.1 Start MongoDB**
```bash
docker run -d -p 27017:27017 --name alliv-mongo mongo:7
```
✅ Expected: Container running, accessible on port 27017

**1.2 Start Backend API**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
✅ Expected: 
- Server starts without errors
- Logs show: "✅ Database connected" or "⚠️ Server will run WITHOUT database"
- Accessible at http://localhost:8000

**1.3 Health Check**
```bash
curl http://localhost:8000/health
```
✅ Expected: `{"status": "healthy", "database": "connected", "version": "1.0.0"}`

**1.4 API Documentation**
- Open: http://localhost:8000/docs
✅ Expected: Swagger UI with all endpoints listed

---

### Phase 2: Registration Flow (Frontend → Backend)

**2.1 User Registration (POST /auth/register)**
```json
{
  "email": "test@alliv.app",
  "password": "SecurePass123!",
  "name": "Test User",
  "birthdate": "1995-06-15"
}
```
✅ Expected:
- Status: 200 OK
- Response: `{ "message": "User created successfully", "userId": "...", "email": "test@alliv.app", "verified": false }`
- User created in MongoDB `users` collection
- Empty profile created in `profiles` collection

**2.2 Email Verification Request (POST /auth/verify/request)**
```json
{
  "channel": "email",
  "destination": "test@alliv.app"
}
```
✅ Expected:
- Status: 200 OK
- Console logs: "📧 Sending verification email to test@alliv.app"
- Console shows: "🔢 Verification code: 123456"
- Verification document created in `verifications` collection

**2.3 Email Verification Confirm (POST /auth/verify/confirm)**
```json
{
  "code": "123456"
}
```
✅ Expected:
- Status: 200 OK
- Response: `{ "message": "Verification successful", "verified": true }`
- User's `verified` field updated to `true` in database

**2.4 Login (POST /auth/login)**
```json
{
  "email": "test@alliv.app",
  "password": "SecurePass123!"
}
```
✅ Expected:
- Status: 200 OK
- Response: `{ "access_token": "...", "refresh_token": "...", "token_type": "bearer" }`
- Tokens are valid JWTs

---

### Phase 3: Profile Management

**3.1 Get Current Profile (GET /me)**
Headers: `Authorization: Bearer <access_token>`

✅ Expected:
- Status: 200 OK
- Profile data with user info
- Shows: name, email, verified status, empty skills/interests

**3.2 Update Profile (PUT /me)**
```json
{
  "bio": "Passionate developer building the future",
  "field": "Developer",
  "skills": ["React", "TypeScript", "Node.js"],
  "interests": ["AI", "Web3", "Startups"],
  "goals": "Build innovative products that matter",
  "location": {
    "city": "Jakarta",
    "country": "Indonesia",
    "lat": -6.2088,
    "lon": 106.8456,
    "hideExact": false
  },
  "portfolio": {
    "github": "https://github.com/testuser",
    "behance": "https://behance.net/testuser"
  },
  "modePreference": "online"
}
```
✅ Expected:
- Status: 200 OK
- Updated profile returned
- All fields saved correctly in database

**3.3 Upload Photos (PUT /me/photos)**

First, simulate Cloudinary upload URLs:
```json
{
  "photos": [
    "https://res.cloudinary.com/dvlqelnsf/image/upload/v1/profile1.jpg",
    "https://res.cloudinary.com/dvlqelnsf/image/upload/v1/profile2.jpg"
  ]
}
```
✅ Expected:
- Status: 200 OK
- Photos array updated
- Validation: 1-6 photos only

**3.4 View Public Profile (GET /profiles/{userId})**
✅ Expected:
- Status: 200 OK
- Profile visible without authentication
- Exact location hidden if `hideExact: true`

---

### Phase 4: Discovery

**4.1 Discover Online Users (GET /discover/online)**
Query params: `?field=Developer&limit=10`

✅ Expected:
- List of profiles matching filters
- Compatibility scores shown
- Distance not shown (online mode)

**4.2 Discover Nearby Users (GET /discover/nearby)**
Query params: `?lat=-6.2088&lon=106.8456&radiusKm=10&limit=10`

✅ Expected:
- List of nearby profiles
- Distance in km shown
- Sorted by distance or compatibility

---

### Phase 5: Matching Flow

**5.1 Swipe Skip (POST /swipes)**
```json
{
  "targetId": "user_id_here",
  "action": "skip"
}
```
✅ Expected:
- Swipe recorded
- No match created

**5.2 Swipe Connect (POST /swipes)**
```json
{
  "targetId": "user_id_here",
  "action": "connect"
}
```
✅ Expected:
- Swipe recorded
- If mutual: Match created
- Response indicates match status

**5.3 Get Matches (GET /matches)**
✅ Expected:
- List of all matches
- Each match includes other user's profile
- Compatibility score shown

**5.4 Open Chat (POST /matches/{matchId}/open-chat)**
✅ Expected:
- Chat created or existing chat returned
- Chat ID provided

---

### Phase 6: Real-time Chat

**6.1 Get Chat Messages (GET /chats/{chatId}/messages)**
✅ Expected:
- List of messages (empty initially)
- Pagination support

**6.2 Send Message (POST /chats/{chatId}/messages)**
```json
{
  "text": "Hey! Excited to collaborate!"
}
```
✅ Expected:
- Message saved
- Message returned with ID and timestamp

**6.3 WebSocket Connection (ws://localhost:8000/ws/chat)**
```javascript
// Client connects
socket.emit('chat.join', { chatId: 'chat_id_here' });

// Client sends message
socket.emit('message.send', { 
  chatId: 'chat_id_here', 
  text: 'Real-time message!' 
});

// Client receives
socket.on('message.new', (data) => {
  console.log('New message:', data);
});
```
✅ Expected:
- Connection established
- Messages received in real-time
- Typing indicators work
- Read receipts update

---

### Phase 7: Collaboration Features

**7.1 Create Project (POST /projects)**
```json
{
  "title": "AI-Powered Recipe App",
  "description": "Building a smart cooking assistant",
  "tags": ["AI", "Mobile", "React Native"],
  "location": "Jakarta"
}
```
✅ Expected:
- Project created
- Owner set to current user

**7.2 Apply to Project (POST /projects/{projectId}/apply)**
✅ Expected:
- Application recorded
- Owner notified (future)

**7.3 Create Event (POST /events)**
```json
{
  "title": "Jakarta Startup Meetup",
  "startsAt": "2025-12-01T18:00:00Z",
  "venueCity": "Jakarta",
  "tags": ["Networking", "Startups"]
}
```
✅ Expected:
- Event created
- Host set to current user

**7.4 RSVP to Event (POST /events/{eventId}/rsvp)**
✅ Expected:
- RSVP recorded
- Attendee count updated

---

### Phase 8: Safety & Moderation

**8.1 Report User (POST /reports)**
```json
{
  "targetUserId": "bad_user_id",
  "reason": "spam",
  "details": "Sending unsolicited promotional messages"
}
```
✅ Expected:
- Report recorded
- Admin can review (future)

**8.2 Block User (POST /blocks)**
```json
{
  "targetUserId": "blocked_user_id"
}
```
✅ Expected:
- Block recorded
- User won't appear in discovery
- Can't message blocked user

---

### Phase 9: OAuth Flow

**9.1 Get Google OAuth URL (GET /auth/oauth/google/url)**
✅ Expected:
- Google authorization URL returned
- Redirects to Google login

**9.2 GitHub OAuth (GET /auth/oauth/github/url)**
✅ Expected:
- GitHub authorization URL
- Proper scope requested

**9.3 X/Twitter OAuth (GET /auth/oauth/x/url)**
✅ Expected:
- X OAuth URL
- Correct client ID

---

### Phase 10: Frontend Integration

**10.1 Start Frontend**
```bash
cd frontend
npm run dev
```
✅ Expected:
- Vite dev server starts
- Opens at http://localhost:5173

**10.2 Complete Registration Flow**
1. Visit http://localhost:5173/register
2. Click "I Accept the Rules"
3. Choose OAuth provider or Email
4. Fill account details
5. Upload photos (1-6)
6. Fill profile info (field, skills, interests)
7. Enable location
8. Review and submit

✅ Expected:
- All steps work smoothly
- Data saved to backend
- Redirects to /home after completion

**10.3 Profile Editing**
1. Navigate to profile page
2. Click "Edit Profile"
3. Update bio, skills, interests
4. Upload new photo
5. Save changes

✅ Expected:
- Changes reflected immediately
- Backend updated
- Photos uploaded to Cloudinary

**10.4 Discovery Mode**
1. Switch between Online/Nearby
2. Apply filters (field, skills)
3. View profiles
4. Swipe cards

✅ Expected:
- Modes switch correctly
- Filters work
- Cards display properly
- Swipe animations smooth

---

## 🔧 Troubleshooting

### Backend Won't Start
- Check MongoDB is running: `docker ps | grep alliv-mongo`
- Check port 8000 is free: `netstat -ano | findstr :8000`
- Check logs for errors

### Database Connection Failed
- Ensure MongoDB container is running
- Check .env MONGO_URI is correct
- Try: `docker logs alliv-mongo`

### Authentication Errors
- Check JWT secrets are set in .env
- Verify tokens are not expired
- Clear localStorage in browser

### Photos Won't Upload
- Check Cloudinary credentials in .env
- Verify CORS settings
- Check file size (<10MB)

### WebSocket Not Connecting
- Check Socket.IO is running (console logs)
- Verify CORS allows WebSocket
- Check browser console for errors

---

## ✅ Success Criteria

- [x] User can register with email
- [x] Email verification works
- [x] User can login and get tokens
- [x] Profile can be created and updated
- [x] Photos can be uploaded
- [x] Discovery shows nearby/online users
- [x] Swipe actions create matches
- [x] Chat messages send/receive
- [x] WebSocket real-time works
- [x] Projects can be created
- [x] Events can be RSVPed
- [x] Reports/blocks function
- [x] OAuth URLs generate correctly

---

## 📊 Performance Benchmarks

- Registration: < 500ms
- Login: < 200ms
- Profile update: < 300ms
- Discovery query: < 1s (50 profiles)
- Swipe action: < 100ms
- Message send: < 50ms
- WebSocket latency: < 20ms

---

## 🚀 Next Steps After Testing

1. ✅ Add real Cloudinary upload flow
2. ✅ Implement OAuth token exchange
3. ✅ Add real email/SMS sending
4. ✅ Set up Redis for caching
5. ✅ Add rate limiting
6. ✅ Write unit tests
7. ✅ Write E2E tests
8. ✅ Deploy to production
