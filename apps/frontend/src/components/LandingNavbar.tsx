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
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-white/10 bg-[rgba(2,3,10,0.92)] shadow-[0_15px_60px_rgba(2,3,10,0.85)] backdrop-blur-xl'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo/alivvlogo.png" alt="Alliv Logo" className="h-10 w-10 object-contain" />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold tracking-tight text-white">Alliv</span>
              <span className="text-[0.55rem] uppercase tracking-[0.4em] text-white/50">Beta</span>
            </div>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-medium text-white/70 md:flex">
            <a href="#learn" className="transition-colors hover:text-white">
              Product
            </a>
            <a href="#trust" className="transition-colors hover:text-white">
              Trust
            </a>
            <Link to="/login" className="transition-colors hover:text-white">
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center rounded-full bg-white/90 px-5 py-2 text-sm font-semibold text-black transition-all hover:bg-white hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <Link to="/login" className="text-sm text-white/75">
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-white"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
