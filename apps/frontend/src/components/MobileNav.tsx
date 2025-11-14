import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';

export const MobileNav = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/discover', icon: Search, label: 'Discover' },
    { path: '/projects/create', icon: PlusCircle, label: 'Create' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  // Don't show on landing/login/register pages
  const hiddenPaths = ['/', '/login', '/register'];
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-surface/95 backdrop-blur-lg border-t border-white/10">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center py-2 px-3 group"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                <Icon 
                  size={24}
                  className={`transition-all ${
                    isActive 
                      ? 'text-accent-blue' 
                      : 'text-white/60 group-hover:text-white'
                  }`}
                />
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-blue rounded-full"
                  />
                )}
              </motion.div>
              <span className={`text-[10px] mt-1 ${
                isActive ? 'text-accent-blue' : 'text-white/40'
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
