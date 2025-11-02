# Alliv - AI-Powered Collaboration Platform

## 🚀 Overview
Alliv is a professional collaboration platform designed to connect developers, designers, photographers, musicians, and other creators for platonic project collaborations. Built with React, TypeScript, and FastAPI, featuring AI-powered matching and real-time communication.

## ✨ Features Implemented

### 1. **Onboarding & Registration** ✅
- **Welcome Page**: Alliv branding with pulse animation, particle effects, "Powered by xAI" footer
- **House Rules Modal**: Indonesian localization, animated checkmarks, agreement system
- **Account Creation**: Multi-step flow with validation
- **Photo Upload**: 6 circular slots (180px), drag & drop, portfolio focus
- **Skills/Interests Selection**: Dynamic categories with icons
- **Profile Summary**: Preview before confirmation

### 2. **Discovery & Matching** ✅
- **Smart Swipe Cards**: Tinder-style interface with 3D tilt effects
- **AI Matching**: Score-based compatibility (using xAI embeddings)
- **Filters**: Distance, skills, vibes (Casual/Serious)
- **Super Connect**: Highlight top matches (3x/week free)
- **Rewind**: Undo last 3 swipes

### 3. **Nearby Feature** ✅
- **Map View**: Interactive OpenStreetMap integration
- **Location-based Search**: Find collaborators within radius (1-50km)
- **List/Map Toggle**: Switch between views
- **Real-time Status**: Online/offline indicators
- **Quick Connect**: Direct connect from map pins

### 4. **Chat & Communication** ✅
- **Real-time Messaging**: WebSocket-based chat
- **Voice Notes**: 30-second audio recording with waveform visualization
- **File Sharing**: Drag & drop images/PDFs (10MB max)
- **AI Icebreakers**: Smart conversation starters
- **Flirt Detector**: Automatic platonic reminders
- **Group Chat**: Auto-create for project teams

### 5. **Projects & Collaboration** ✅
- **Project Board**: Kanban-style drag & drop interface
- **Task Management**: Create, assign, track progress
- **Apply System**: One-click apply to open projects
- **View Toggle**: List view / Kanban view
- **Filters**: All / Open / My Projects

### 6. **Safety & Trust** ✅
- **Report System**: Comprehensive reporting with evidence upload
- **Trust Score**: 0-100 based on behavior
- **Verification Badge**: Portfolio-based verification
- **Privacy Controls**: Hide location/gender, incognito mode
- **Block/Report**: Quick action buttons

### 7. **Profile & Portfolio** ✅
- **Portfolio Showcase**: Link GitHub/Behance/external work
- **Skills Display**: Categorized skill chips
- **Goals Section**: Collaboration objectives
- **QR Share**: Generate profile QR code

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: TailwindCSS + Glass morphism design
- **Animations**: Framer Motion
- **State**: Zustand
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Particles**: @tsparticles/react
- **Drag & Drop**: @hello-pangea/dnd
- **Build**: Vite

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB with Motor
- **Auth**: JWT + Argon2
- **Real-time**: Python-SocketIO
- **AI**: xAI Grok integration
- **File Storage**: Cloudinary
- **Rate Limiting**: SlowAPI

## 📁 Project Structure
```
COLABMATCH/
├── frontend/              # React TypeScript frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── routes/       # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities
│   │   ├── store/        # Zustand stores
│   │   └── types/        # TypeScript definitions
│   └── package.json
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── routes/       # API endpoints
│   │   ├── models.py     # Data models
│   │   ├── auth.py       # Authentication
│   │   ├── ai_engine.py  # AI matching logic
│   │   └── main.py       # FastAPI app
│   └── requirements.txt
└── docker-compose.yml    # Container orchestration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB (local or cloud)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/alliv.git
cd alliv
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
python -m uvicorn app.main:app --reload
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

4. **Access the app**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🔑 Environment Variables

### Backend (.env)
```
MONGODB_URL=mongodb://localhost:27017/alliv
JWT_SECRET=your-secret-key
GROK_API_KEY=your-xai-key
CLOUDINARY_URL=your-cloudinary-url
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
VITE_WEBSOCKET_URL=ws://localhost:8000
```

## 📱 Key Features Details

### Smart Matching Algorithm
- Uses xAI Grok embeddings for semantic similarity
- Factors: skills overlap, location proximity, project interests
- Real-time score calculation (0-100%)

### Safety Protocols
- All chats monitored for inappropriate content
- Automatic flirt detection with warnings
- 24-hour response guarantee for urgent reports
- Identity verification through portfolio review

### Monetization (Future)
- Premium subscriptions for unlimited swipes
- Project boost visibility ($0.99)
- Event priority listing ($1.99)
- Affiliate links for tools/services

## 🎨 Design System

### Colors
- Primary: #6E9EFF (Accent Blue)
- Secondary: #A78BFA (Accent Purple)
- Background: #0B0B0B (Dark)
- Surface: #0F1322 (Dark Surface)
- Glass: rgba(255,255,255,0.05)

### Typography
- Font: System UI stack
- Headers: Bold, gradient text
- Body: Regular, 60% opacity

### Components
- Glass morphism cards
- Glow effects on hover
- Smooth transitions (300ms)
- Responsive breakpoints

## 📈 Performance Optimizations
- Code splitting with React.lazy
- Image compression (1MB max)
- Debounced search inputs
- Virtual scrolling for long lists
- Service worker for offline support

## 🔒 Security
- Argon2 password hashing
- JWT with refresh tokens
- Rate limiting (100 req/min)
- Input sanitization
- CORS protection
- File type validation

## 📱 Mobile Responsiveness
- Touch-optimized swipe gestures
- Bottom navigation for mobile
- Responsive grid layouts
- PWA capabilities

## 🧪 Testing
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 🚢 Deployment
- Frontend: Vercel/Netlify
- Backend: Railway/Render
- Database: MongoDB Atlas
- File Storage: Cloudinary

## 📝 License
MIT License - See LICENSE file

## 🤝 Contributing
Pull requests welcome! Please read CONTRIBUTING.md first.

## 📞 Support
- Email: support@alliv.com
- Discord: discord.gg/alliv
- Documentation: docs.alliv.com

## 🎯 Roadmap
- [ ] Mobile apps (React Native)
- [ ] Video chat integration
- [ ] AI project recommendations
- [ ] Blockchain verification
- [ ] Multi-language support

---

**Built with 💙 by the Alliv Team**
*Powered by xAI*
