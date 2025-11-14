import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../components/LandingNavbar';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { Heart, ShieldCheck, Sparkles, Users, Zap, Lock, Globe } from 'lucide-react';
import { useRef } from 'react';

const featureCards = [
  {
    icon: Sparkles,
    title: 'Curated matches',
    body: 'AI + human review keeps every collaborator relevant so you swipe with purpose.',
  },
  { icon: Users, title: 'Real profiles', body: 'Stacks, availability, and proof of work appear up front.' },
  {
    icon: ShieldCheck,
    title: 'Safety built-in',
    body: 'Identity checks, audit trails, and rate limits protect every conversation.',
  },
];

const stats = [
  { label: 'Active collaborators', value: '18k+' },
  { label: 'Projects shipped', value: '3.4k' },
  { label: 'Avg. reply time', value: '3m 18s' },
];

export const Landing = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const backgroundOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0.3]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#0A0F1C] text-white overflow-hidden">
      <AnimatedBackground />
      
      <motion.div 
        className="pointer-events-none fixed inset-0"
        style={{ opacity: backgroundOpacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1C]/80 via-[#0A0F1C]/60 to-[#0A0F1C]/90" />
      </motion.div>

      <LandingNavbar />
      <main className="relative z-10 space-y-24 pb-20 pt-28">
        <Hero />
        <SecurityFeatures />
        <FeatureGrid />
        <CTA />
        <Footer />
      </main>
    </div>
  );
};

const Hero = () => (
  <section className="shell-content">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent px-8 py-16 shadow-[0_30px_120px_rgba(53,245,255,0.15)] backdrop-blur-2xl border border-white/10"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(93,110,255,0.35),transparent_60%)] opacity-80" />
      <div className="relative space-y-8 text-center md:text-left">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
          <Sparkles className="h-4 w-4" />
          Swipe smarter
        </div>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
          Swipe through verified collaborators and launch faster.
        </h1>
        <p className="mx-auto max-w-2xl text-base text-white/70 md:mx-0 md:text-lg">
          Alliv matches founders, designers, and engineers using live availability, real work samples,
          and transparent intent. No fluff, just people ready to build.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-start">
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-base font-semibold text-black shadow-[0_20px_45px_rgba(0,0,0,0.35)]"
          >
            Get started
          </Link>
          <Link to="/discover" className="text-white/70 hover:text-white">
            Browse the queue
          </Link>
        </div>
        <div className="grid gap-4 pt-6 text-center sm:grid-cols-3 sm:text-left">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/5 px-4 py-3 text-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur">
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  </section>
);

const SecurityFeatures = () => (
  <section className="shell-content space-y-10">
    <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="text-center space-y-3"
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400 border border-emerald-500/30">
        <Lock className="h-4 w-4" />
        Enterprise Security
      </div>
      <h2 className="text-3xl font-bold sm:text-4xl bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
        Bank-Level Security & Privacy
      </h2>
      <p className="text-white/60 max-w-2xl mx-auto">
        Your data is protected with military-grade encryption and advanced security protocols
      </p>
    </motion.div>
    
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[
        {
          icon: Lock,
          title: "End-to-End Encryption",
          description: "AES-256 encryption for all messages and data",
          color: "from-emerald-500 to-green-500"
        },
        {
          icon: ShieldCheck,
          title: "2FA Authentication",
          description: "Multi-factor authentication for account access",
          color: "from-blue-500 to-cyan-500"
        },
        {
          icon: Zap,
          title: "DDoS Protection",
          description: "CloudFlare protection against attacks",
          color: "from-purple-500 to-pink-500"
        },
        {
          icon: Globe,
          title: "GDPR Compliant",
          description: "Full compliance with data protection laws",
          color: "from-orange-500 to-yellow-500"
        }
      ].map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl"
            style={{
              background: `linear-gradient(135deg, ${feature.color.replace('from-', '').replace('to-', '')})`
            }}
          />
          <div className="relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:border-white/20 transition-all">
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-4`}>
              <feature.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-white/60">{feature.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

const FeatureGrid = () => (
  <section className="shell-content space-y-10">
    <div className="space-y-3 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-white/50">Why Alivv</p>
      <h2 className="text-3xl font-semibold sm:text-4xl">Less guesswork, more shipped work.</h2>
    </div>
    <div className="grid gap-6 md:grid-cols-3">
      {featureCards.map(({ icon: Icon, title, body }) => (
        <div key={title} className="rounded-3xl bg-white/5 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <Icon className="mb-5 h-10 w-10 text-white" />
          <h3 className="mb-3 text-2xl font-semibold">{title}</h3>
          <p className="text-white/65">{body}</p>
        </div>
      ))}
    </div>
  </section>
);

const CTA = () => (
  <section className="shell-content">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-[48px] bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] px-10 py-16 text-center shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,111,156,0.35),transparent_60%)] opacity-90" />
      <div className="relative space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em]">
          <Heart className="h-4 w-4" />
          Ready when you are
        </div>
        <h2 className="text-4xl font-bold sm:text-5xl">Queue up, match fast, build loud.</h2>
        <p className="mx-auto max-w-2xl text-white/70">
          Drop into the queue, pick your vibe, and meet collaborators already aligned on tools,
          timelines, and ambition.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-black"
        >
          Claim my spot
        </Link>
      </div>
    </motion.div>
  </section>
);

const Footer = () => (
  <footer className="shell-content py-12 text-center text-sm text-white/60">
    <p>&copy; {new Date().getFullYear()} Alivv. Built for fearless collaborators.</p>
    <div className="mt-4 flex flex-wrap justify-center gap-6">
      <a href="#" className="hover:text-white">
        Privacy
      </a>
      <a href="#" className="hover:text-white">
        Terms
      </a>
      <a href="#" className="hover:text-white">
        Support
      </a>
    </div>
  </footer>
);

export default Landing;
