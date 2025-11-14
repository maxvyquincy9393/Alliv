import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[rgba(5,6,8,0.85)] backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo/alivvlogo.png" alt="Alivv Logo" className="w-7 h-7 object-contain" />
            <span className="text-2xl font-semibold text-white">Alivv</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70">
            <a href="#learn" className="hover:text-white transition-colors">
              Learn
            </a>
            <a href="#safety" className="hover:text-white transition-colors">
              Safety
            </a>
            <Link to="/login" className="hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 rounded-full bg-white text-black font-semibold shadow-[0_8px_20px_rgba(2,6,23,0.35)] hover:-translate-y-0.5"
            >
              Sign up
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-3">
            <Link to="/login" className="text-white/75 text-sm">
              Log in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-full bg-white text-black text-sm font-semibold"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
