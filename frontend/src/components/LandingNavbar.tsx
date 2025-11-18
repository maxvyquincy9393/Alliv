import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoMark from '../../logo/logo_alivv.png';
import { useTranslation } from 'react-i18next';

export const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { i18n } = useTranslation();
  const languageLabel = i18n.language.startsWith('id') ? 'ID' : 'EN';
  const handleLanguageToggle = () => {
    i18n.changeLanguage(i18n.language.startsWith('id') ? 'en' : 'id');
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-black/50 backdrop-blur-xl border-b border-white/5 py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="container-width">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 border border-white/10 group-hover:bg-white/20 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <img
                src={logoMark}
                alt="Alivv logo"
                className="h-6 w-6 object-contain relative z-10"
              />
            </div>
            <span className="text-xl font-bold tracking-tight font-display">Alliv</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6 text-sm font-medium text-white/60">
              <a href="#product" className="hover:text-white transition-colors">Product</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            </div>
            
            <div className="h-4 w-px bg-white/10"></div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleLanguageToggle}
                className="text-xs font-semibold text-white/40 hover:text-white transition-colors uppercase tracking-wider"
              >
                {languageLabel}
              </button>
              <Link 
                to="/login" 
                className="text-sm font-medium text-white hover:text-white/80 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-all hover:bg-gray-200 hover:scale-105 active:scale-95"
              >
                Get Started
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4 md:hidden">
             <Link to="/login" className="text-sm font-medium text-white/70 hover:text-white">
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-gray-200"
            >
              Start
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
