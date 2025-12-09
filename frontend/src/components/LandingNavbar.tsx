import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from './Logo';
import { Magnetic } from './Magnetic';

export const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${scrolled
        ? 'bg-[#020204]/80 backdrop-blur-xl border-white/10 py-4'
        : 'bg-transparent border-transparent py-8'
        }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo - Larger and to the side */}
        <Link to="/" className="flex items-center gap-3 group">
          <Logo size="large" />
          <span className="text-xl font-display font-bold tracking-tight text-white">ALLIV</span>
        </Link>

        {/* Right Side Group: Links + Actions */}
        <div className="flex items-center gap-8">
          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
             <Magnetic strength={20}>
                <Link
                  to="/features"
                  className="text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  Features
                </Link>
              </Magnetic>
             <Magnetic strength={20}>
                <Link
                  to="/about"
                  className="text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  About
                </Link>
              </Magnetic>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <Magnetic strength={20}>
              <Link
                to="/login"
                className="hidden md:block text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                Log in
              </Link>
            </Magnetic>
            <Magnetic strength={40}>
              <Link
                to="/register"
                className="group relative px-6 py-2.5 rounded-full bg-white text-black text-sm font-bold tracking-wide overflow-hidden transition-transform hover:scale-105 flex items-center justify-center"
              >
                <span className="relative z-10">Join Network</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-cyan-100 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}