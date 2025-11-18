import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, Briefcase, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '../styles/theme';

export const MobileNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/home', icon: Home, label: 'Home', color: theme.colors.primary.blue },
    { path: '/discover', icon: Search, label: 'Discover', color: theme.colors.primary.purple },
    { path: '/events', icon: Calendar, label: 'Events', color: theme.colors.primary.pink },
    { path: '/projects', icon: Briefcase, label: 'Projects', color: theme.colors.primary.yellow },
    { path: '/profile', icon: User, label: 'Profile', color: theme.colors.primary.blue }
  ];

  // Don't show on landing/login/register pages
  const hiddenPaths = ['/', '/login', '/register'];
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      {/* Glass background */}
      <div className="absolute inset-0 glass-panel rounded-2xl" />

      <div className="relative flex items-center justify-around px-4 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-1 py-2 px-3 min-w-[60px] group"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="relative"
              >
                {/* Active background glow */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute inset-0 -m-2 rounded-2xl"
                      style={{
                        background: `radial-gradient(circle, ${item.color}40 0%, transparent 70%)`,
                        filter: 'blur(8px)',
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon container */}
                <div className={`relative p-2 rounded-2xl transition-all duration-300 ${isActive
                    ? 'bg-gradient-to-br from-white/10 to-white/5'
                    : 'group-hover:bg-white/5'
                  }`}>
                  <Icon
                    size={22}
                    className={`transition-all duration-300 ${isActive
                        ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                        : 'text-white/50 group-hover:text-white/80'
                      }`}
                    style={{
                      filter: isActive ? `drop-shadow(0 0 12px ${item.color})` : 'none',
                    }}
                  />
                </div>

                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="activeMobileTab"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
              </motion.div>

              {/* Label */}
              <span className={`text-[10px] font-medium transition-all duration-300 ${isActive
                  ? 'text-white'
                  : 'text-white/40 group-hover:text-white/60'
                }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
