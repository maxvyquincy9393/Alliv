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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <img 
              src="/logo/alivvlogo.png" 
              alt="Alivv Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-2xl font-semibold text-black">Alivv</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#learn" className="text-black hover:opacity-70 transition-opacity">
              Learn
            </a>
            <a href="#safety" className="text-black hover:opacity-70 transition-opacity">
              Safety
            </a>
            <Link to="/login" className="text-black hover:opacity-70 transition-opacity">
              Log in
            </Link>
            <Link 
              to="/register" 
              className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              Sign up
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <Link to="/login" className="text-black hover:opacity-70 transition-opacity text-sm">
              Log in
            </Link>
            <Link 
              to="/register" 
              className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-sm"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
