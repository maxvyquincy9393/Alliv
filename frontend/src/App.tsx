import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './routes/Landing';
import { Login } from './routes/Login';
import { Register } from './routes/Register';
import { VerifyEmail } from './routes/VerifyEmail';
import { ForgotPassword } from './routes/ForgotPassword';
import { VerifyResetOTP } from './routes/VerifyResetOTP';
import { ResetPassword } from './routes/ResetPassword';
import { SetupProfile } from './routes/SetupProfile';
import { Home } from './routes/Home';
import { Discover } from './routes/Discover';
import { Chat } from './routes/Chat';
import { Projects } from './routes/Projects';
import { CreateProject } from './routes/CreateProject';
import { Events } from './routes/Events';
import { CreateEvent } from './routes/CreateEvent';
import { Profile } from './routes/Profile';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register/*" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-reset-otp" element={<VerifyResetOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected routes - require authentication */}
            <Route path="/setup-profile" element={
              <ProtectedRoute>
                <SetupProfile />
              </ProtectedRoute>
            } />
            <Route path="/home" element={
              <ProtectedRoute requireProfile>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/discover" element={
              <ProtectedRoute requireProfile>
                <Discover />
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute requireProfile>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute requireProfile>
                <Projects />
              </ProtectedRoute>
            } />
            <Route path="/projects/create" element={
              <ProtectedRoute requireProfile>
                <CreateProject />
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute requireProfile>
                <Events />
              </ProtectedRoute>
            } />
            <Route path="/events/create" element={
              <ProtectedRoute requireProfile>
                <CreateEvent />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
