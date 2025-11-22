import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Briefcase, Calendar, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Logo } from './Logo';

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
      <div className="md:hidden fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between w-full max-w-sm bg-[#0b0b0f]/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-glow-blue">
          <Link to="/home" className="flex items-center">
            <Logo size="small" />
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors border border-white/5"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-20 left-4 right-4 z-40 bg-[#0b0b0f]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 space-y-1">
              <MenuLink to="/home" icon={Home} label="Home" onClick={() => setMenuOpen(false)} />
              <MenuLink to="/projects" icon={Briefcase} label="Projects" onClick={() => setMenuOpen(false)} />
              <MenuLink to="/events" icon={Calendar} label="Events" onClick={() => setMenuOpen(false)} />
              <div className="h-px bg-white/5 my-2 mx-2" />
              <MenuLink to="/settings" icon={Settings} label="Settings" onClick={() => setMenuOpen(false)} />
              <MenuLink to="/logout" icon={LogOut} label="Logout" onClick={() => setMenuOpen(false)} variant="danger" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

interface MenuLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

const MenuLink = ({ to, icon: Icon, label, onClick, variant = 'default' }: MenuLinkProps) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${variant === 'danger'
        ? 'text-red-400 hover:bg-red-500/10'
        : 'text-white/70 hover:text-white hover:bg-white/5'
      }`}
  >
    <Icon size={18} />
    <span className="font-medium text-sm">{label}</span>
  </Link>
);
