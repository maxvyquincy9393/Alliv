import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export const MobileTopBar = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Don't show on landing/login/register pages
  const hiddenPaths = ['/', '/login', '/register'];
  if (hiddenPaths.some(path => location.pathname === path)) {
    return null;
  }

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-dark-surface/95 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/home">
            <motion.div
              className="text-xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #BDB4FF 0%, #6EE6FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 8px rgba(189, 180, 255, 0.12))'
              }}
            >
              Alliv
            </motion.div>
          </Link>
          
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-white/60 hover:text-white"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Menu Overlay */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="md:hidden fixed inset-0 z-40 bg-dark-bg/95 backdrop-blur-lg pt-16"
          onClick={() => setMenuOpen(false)}
        >
          <div className="p-6 space-y-4">
            <Link 
              to="/projects" 
              className="block text-lg text-white/80 hover:text-white py-2"
              onClick={() => setMenuOpen(false)}
            >
              Projects
            </Link>
            <Link 
              to="/events" 
              className="block text-lg text-white/80 hover:text-white py-2"
              onClick={() => setMenuOpen(false)}
            >
              Events
            </Link>
            <Link 
              to="/settings" 
              className="block text-lg text-white/80 hover:text-white py-2"
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </Link>
            <Link 
              to="/logout" 
              className="block text-lg text-red-400 hover:text-red-300 py-2"
              onClick={() => setMenuOpen(false)}
            >
              Logout
            </Link>
          </div>
        </motion.div>
      )}
    </>
  );
};
