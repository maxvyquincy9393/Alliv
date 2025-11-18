import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../components/LandingNavbar';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { ArrowRight, CheckCircle, Code, Layers, Zap, Shield, Users } from 'lucide-react';
import { useRef } from 'react';

export const Landing = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const backgroundOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0.3]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#050505] text-white overflow-hidden">
      <AnimatedBackground />
      
      <motion.div 
        className="pointer-events-none fixed inset-0 z-0"
        style={{ opacity: backgroundOpacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-[#050505]/80 to-[#050505]" />
      </motion.div>

      <LandingNavbar />
      
      <main className="relative z-10">
        <Hero />
        <StatsSection />
        <FeatureGrid />
        <HowItWorks />
        <CTA />
        <Footer />
      </main>
    </div>
  );
};

const Hero = () => (
  <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
    <div className="container-width relative z-10 flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-white/70 backdrop-blur-md mb-8"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        Now in Beta
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-8"
      >
        <span className="text-white">Collaborate without</span>
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-600">
          the chaos.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="max-w-2xl text-lg md:text-xl text-white/60 mb-10 leading-relaxed"
      >
        Connect with developers, designers, and founders who are actually ready to build. 
        Verified skills, real portfolios, zero noise.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="flex flex-col sm:flex-row items-center gap-4"
      >
        <Link
          to="/register"
          className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-black transition-all hover:bg-gray-200 hover:scale-105 active:scale-95"
        >
          Start Building
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          to="/discover"
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20 backdrop-blur-sm"
        >
          Explore Talent
        </Link>
      </motion.div>
    </div>
  </section>
);

const StatsSection = () => (
  <div className="border-y border-white/5 bg-black/20 backdrop-blur-sm">
    <div className="container-width py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { label: 'Active Users', value: '12k+' },
          { label: 'Projects Shipped', value: '3.4k' },
          { label: 'Countries', value: '45+' },
          { label: 'Matches Made', value: '85k' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-xs font-medium uppercase tracking-wider text-white/40">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

const FeatureGrid = () => (
  <section className="py-32 container-width">
    <div className="text-center mb-20">
      <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for speed</h2>
      <p className="text-white/50 max-w-2xl mx-auto">
        We stripped away the noise of traditional networking. 
        No spam, no recruiters, just builders.
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-6">
      {[
        {
          icon: Zap,
          title: 'Instant Matching',
          desc: 'Our algorithm pairs you based on tech stack, availability, and project scope.',
        },
        {
          icon: Shield,
          title: 'Verified Skills',
          desc: 'GitHub and Behance integrations prove you can actually do what you say.',
        },
        {
          icon: Users,
          title: 'Dedicated Teams',
          desc: 'Form squads instantly. Chat, share files, and manage tasks in one place.',
        },
        {
          icon: Code,
          title: 'Code-First Profiles',
          desc: 'Showcase your actual commits and design files, not just a resume.',
        },
        {
          icon: Layers,
          title: 'Project Management',
          desc: 'Built-in kanban boards and milestone tracking to keep you shipping.',
        },
        {
          icon: CheckCircle,
          title: 'Trust Score',
          desc: 'Community-driven reputation system ensures high-quality interactions.',
        },
      ].map((feature, i) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="group p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
        >
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors">
            <feature.icon className="h-6 w-6 text-white/80" />
          </div>
          <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
          <p className="text-white/50 leading-relaxed">{feature.desc}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

const HowItWorks = () => (
  <section className="py-32 border-t border-white/5">
    <div className="container-width">
      <div className="flex flex-col lg:flex-row gap-20 items-center">
        <div className="lg:w-1/2">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
            From idea to MVP <br />
            <span className="text-white/40">in record time.</span>
          </h2>
          <div className="space-y-12">
            {[
              { step: '01', title: 'Create Profile', desc: 'Sync your GitHub/Behance. We auto-fill your skills.' },
              { step: '02', title: 'Swipe to Match', desc: 'Filter by stack, role, and vibes. Right for yes.' },
              { step: '03', title: 'Start Building', desc: 'Launch a workspace with integrated chat and tasks.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-6">
                <div className="text-xs font-mono text-white/30 pt-2">{item.step}</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-white/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:w-1/2 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-[2rem] transform rotate-3" />
          <div className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-[#0A0A0A] shadow-2xl">
            {/* Abstract UI representation */}
            <div className="p-6 border-b border-white/5 flex gap-4 items-center">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
              </div>
              <div className="h-2 w-32 rounded-full bg-white/10" />
            </div>
            <div className="p-8 space-y-6 opacity-60">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10" />
                <div className="space-y-2">
                  <div className="h-3 w-24 rounded-full bg-white/20" />
                  <div className="h-2 w-40 rounded-full bg-white/10" />
                </div>
              </div>
              <div className="h-32 rounded-xl bg-white/5 border border-white/5" />
              <div className="flex gap-4">
                <div className="h-10 flex-1 rounded-lg bg-white/10" />
                <div className="h-10 w-10 rounded-lg bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const CTA = () => (
  <section className="py-32 container-width text-center">
    <div className="relative rounded-[3rem] bg-gradient-to-b from-white/5 to-transparent border border-white/10 p-12 md:p-24 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_70%)]" />
      
      <div className="relative z-10 max-w-3xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
          Ready to ship?
        </h2>
        <p className="text-xl text-white/60">
          Join thousands of developers and designers building the future.
        </p>
        <div className="pt-4">
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-full bg-white px-10 py-5 text-lg font-bold text-black transition-transform hover:scale-105 active:scale-95"
          >
            Get Started Now
          </Link>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-white/5 bg-black py-12">
    <div className="container-width flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-white/40">
      <p>&copy; {new Date().getFullYear()} Alliv Inc.</p>
      <div className="flex gap-8">
        <a href="#" className="hover:text-white transition-colors">Privacy</a>
        <a href="#" className="hover:text-white transition-colors">Terms</a>
        <a href="#" className="hover:text-white transition-colors">Twitter</a>
        <a href="#" className="hover:text-white transition-colors">GitHub</a>
      </div>
    </div>
  </footer>
);

export default Landing;
