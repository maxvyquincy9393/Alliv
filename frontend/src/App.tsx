import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';

const Landing = lazy(() => import('./routes/Landing').then((module) => ({ default: module.Landing })));
const Login = lazy(() => import('./routes/Login').then((module) => ({ default: module.Login })));
const Register = lazy(() => import('./routes/Register').then((module) => ({ default: module.Register })));
const VerifyEmail = lazy(() => import('./routes/VerifyEmail').then((module) => ({ default: module.VerifyEmail })));
const ForgotPassword = lazy(() => import('./routes/ForgotPassword').then((module) => ({ default: module.ForgotPassword })));
const VerifyResetOTP = lazy(() => import('./routes/VerifyResetOTP').then((module) => ({ default: module.VerifyResetOTP })));
const ResetPassword = lazy(() => import('./routes/ResetPassword').then((module) => ({ default: module.ResetPassword })));
const SetupProfile = lazy(() => import('./routes/SetupProfile').then((module) => ({ default: module.SetupProfile })));
const Features = lazy(() => import('./routes/Features').then((module) => ({ default: module.Features })));
const Home = lazy(() => import('./routes/Home').then((module) => ({ default: module.Home })));
const Discover = lazy(() => import('./routes/Discover').then((module) => ({ default: module.Discover })));
const Chat = lazy(() => import('./routes/Chat').then((module) => ({ default: module.Chat })));
const Projects = lazy(() => import('./routes/Projects').then((module) => ({ default: module.Projects })));
const CreateProject = lazy(() => import('./routes/CreateProject').then((module) => ({ default: module.CreateProject })));
const Events = lazy(() => import('./routes/Events').then((module) => ({ default: module.Events })));
const CreateEvent = lazy(() => import('./routes/CreateEvent').then((module) => ({ default: module.CreateEvent })));
const Profile = lazy(() => import('./routes/Profile').then((module) => ({ default: module.Profile })));
const Analytics = lazy(() => import('./routes/Analytics').then((module) => ({ default: module.Analytics })));

const AppFallback = () => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0A0F1C] text-white overflow-hidden relative">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(53,245,255,0.1),transparent_70%)] animate-pulse" />
    <div className="relative z-10 flex flex-col items-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 animate-spin-slow shadow-[0_0_40px_rgba(34,211,238,0.6)]" />
      <div className="text-xs font-bold uppercase tracking-[0.5em] text-white/70 animate-pulse">
        Initializing
      </div>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Suspense fallback={<AppFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/features" element={<Features />} />
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
              <Route path="/analytics" element={
                <ProtectedRoute requireProfile>
                  <Analytics />
                </ProtectedRoute>
              } />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
