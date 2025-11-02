import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { BackgroundFX } from './components/BackgroundFX';
import { Landing } from './routes/Landing';
import { Login } from './routes/Login';
import { Register } from './routes/Register';
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
    <BrowserRouter>
      <BackgroundFX />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register/*" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/create" element={<CreateProject />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/create" element={<CreateEvent />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}

export default App;
