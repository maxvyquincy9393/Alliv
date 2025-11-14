import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Calendar, Briefcase, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../styles/theme';

const navLinks = [
  { path: '/home', label: 'Home', icon: Home, color: theme.colors.primary.blue },
  { path: '/discover', label: 'Discover', icon: Search, color: theme.colors.primary.purple },
  { path: '/chat', label: 'Chat', icon: MessageCircle, color: theme.colors.primary.pink },
  { path: '/projects', label: 'Projects', icon: Briefcase, color: theme.colors.primary.yellow },
  { path: '/events', label: 'Events', icon: Calendar, color: theme.colors.primary.pink },
  { path: '/profile', label: 'Profile', icon: User, color: theme.colors.primary.blue },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      className={`hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-gradient-to-b from-[#0A0F1C]/95 to-[#0A0F1C]/80 backdrop-blur-2xl'
          : 'bg-gradient-to-b from-[#0A0F1C]/80 to-transparent backdrop-blur-xl'
      }`}
      style={{
        boxShadow: scrolled ? '0 20px 40px rgba(0, 0, 0, 0.4)' : '0 10px 30px rgba(0, 0, 0, 0.2)',
      }}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-4">
        {/* Logo */}
        <motion.button
          onClick={() => navigate(isAuthenticated ? '/home' : '/')}
          className="group relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[#35F5FF] to-[#7F6CFF] p-2 rounded-xl">
                <span className="text-2xl font-black text-white">A</span>
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-white">livv</span>
              <p className="text-[10px] uppercase tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF]">
                Collab Match
              </p>
            </div>
          </div>
        </motion.button>

        {/* Navigation Links */}
        <div className="flex items-center gap-2 p-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            
            return (
              <Link key={link.path} to={link.path}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative px-4 py-2.5 rounded-full flex items-center gap-2 transition-all duration-300 ${
                    active 
                      ? 'bg-gradient-to-r text-black font-semibold shadow-lg' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  style={{
                    background: active ? `linear-gradient(135deg, ${link.color} 0%, ${link.color}dd 100%)` : undefined,
                    boxShadow: active ? `0 10px 30px ${link.color}40` : undefined,
                  }}
                >
                  <Icon size={16} />
                  <span className="text-sm font-medium">{link.label}</span>
                  
                  {/* Active glow effect */}
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `radial-gradient(circle, ${link.color}20 0%, transparent 70%)`,
                          filter: 'blur(10px)',
                        }}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* User Profile */}
        <motion.button
          onClick={() => navigate('/profile')}
          className="relative group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#35F5FF] to-[#FF8EC7] rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity" />
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
          </div>
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default Navbar;
