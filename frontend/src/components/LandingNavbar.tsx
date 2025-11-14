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
          ? 'bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] bg-clip-padding backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]'
          : 'bg-[rgba(255,255,255,0.05)] backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.25)]'
      }`}
    >
      <div className="px-4 sm:px-6 lg:px-10">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-full bg-white/5 px-3 py-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-white/80 via-white/40 to-transparent p-1 backdrop-blur">
                <img
                  src={logoMark}
                  alt="Alivv logo"
                  className="h-full w-full object-contain mix-blend-screen drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex flex-col leading-tight text-white">
                <span className="text-xl font-bold tracking-tight">Alivv</span>
                <span className="text-[0.5rem] uppercase tracking-[0.5em] text-white/60 font-semibold">Beta</span>
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-4 text-sm font-medium text-white/70 md:flex">
            <button
              type="button"
              onClick={handleLanguageToggle}
              aria-label="Toggle language"
              className="rounded-full border border-white/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 hover:border-white/40"
            >
              {languageLabel}
            </button>
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
              className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-all hover:bg-white/90"
            >
              Get Started
            </Link>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={handleLanguageToggle}
              aria-label="Toggle language"
              className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80"
            >
              {languageLabel}
            </button>
            <Link to="/login" className="text-sm text-white/75">
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-white/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
