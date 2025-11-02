import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { BlackholeSingularity } from '../components/BlackholeSingularity';

export const LandingMinimal = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      title: 'Smart Matching',
      description: 'AI-powered compatibility across skills & goals',
      icon: '🎯'
    },
    {
      title: 'Dual Discovery',
      description: 'Online or nearby with radius control',
      icon: '🌐'
    },
    {
      title: 'Safe & Real',
      description: 'Verified profiles & trust score',
      icon: '✓'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#E7E7EC] relative overflow-hidden">
      {/* Black Hole Singularity Background */}
      <BlackholeSingularity />
      
      {/* Vignette overlay */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(11, 11, 11, 0.4) 100%)'
        }}
      />

      {/* Top Bar */}
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled ? 'backdrop-blur-md bg-[#0B0B0B]/80 border-b border-white/[0.08]' : ''
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <motion.div
                className="text-2xl font-bold"
                whileHover={{ scale: 1.05 }}
                style={{
                  background: 'linear-gradient(135deg, #BDB4FF 0%, #6EE6FF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 8px rgba(189, 180, 255, 0.12))'
                }}
              >
                Alliv
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#learn" className="text-sm text-[#E7E7EC]/60 hover:text-[#E7E7EC] transition-colors">
                Learn
              </a>
              <a href="#safety" className="text-sm text-[#E7E7EC]/60 hover:text-[#E7E7EC] transition-colors">
                Safety
              </a>
              <a href="#download" className="text-sm text-[#E7E7EC]/60 hover:text-[#E7E7EC] transition-colors">
                Download
              </a>
              <Link 
                to="/login"
                className="px-4 py-1.5 text-sm text-[#E7E7EC]/80 hover:text-[#E7E7EC] transition-all rounded-lg border border-white/10 hover:border-white/20"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 text-sm font-medium rounded-lg transition-all"
                style={{
                  background: 'rgba(189, 180, 255, 0.12)',
                  border: '1px solid rgba(189, 180, 255, 0.2)',
                  color: '#BDB4FF'
                }}
              >
                Sign up
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#E7E7EC]/60"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </nav>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden absolute top-full left-0 w-full bg-[#0B0B0B]/95 backdrop-blur-lg border-b border-white/[0.08]"
            >
              <div className="px-6 py-4 space-y-4">
                <a href="#learn" className="block text-sm text-[#E7E7EC]/60">Learn</a>
                <a href="#safety" className="block text-sm text-[#E7E7EC]/60">Safety</a>
                <a href="#download" className="block text-sm text-[#E7E7EC]/60">Download</a>
                <Link to="/login" className="block text-sm text-[#E7E7EC]/60">Log in</Link>
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* Main Content Container */}
      <div className="max-w-[1200px] mx-auto px-6 pt-32 pb-16">
        {/* Hero Section */}
        <section className="min-h-[calc(100vh-128px)] flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-[680px]"
          >
            <h1 
              className="font-bold mb-6 leading-tight"
              style={{ 
                fontSize: 'clamp(32px, 6vw, 56px)',
                letterSpacing: '-0.02em'
              }}
            >
              Find collaborators.
              <br />
              Build faster.
            </h1>
            
            <p className="text-lg text-[#E7E7EC]/60 mb-16 max-w-[480px] mx-auto">
              Match by skills, interests, and goals. Online or nearby.
            </p>
          </motion.div>
        </section>

        {/* Feature Cards */}
        <section className="py-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[960px] mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="p-6 rounded-xl transition-all hover:-translate-y-1"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div className="text-3xl mb-4 opacity-80">{feature.icon}</div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-[#E7E7EC]/50 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] mt-32">
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#E7E7EC]/40">
            <div>© Alliv</div>
            <div className="flex gap-6">
              <a href="/privacy" className="hover:text-[#E7E7EC]/60 transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-[#E7E7EC]/60 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
