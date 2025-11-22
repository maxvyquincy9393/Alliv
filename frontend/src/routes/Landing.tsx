import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../components/LandingNavbar';
import { Zap, Shield, Cpu, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { Magnetic } from '../components/Magnetic';
import { TiltCard } from '../components/TiltCard';
import { NetworkGlobe } from '../components/NetworkGlobe';

export const Landing = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#000000] text-white overflow-hidden selection:bg-blue-500/30 font-sans">
      <LandingNavbar />

      {/* Cinematic Background - Cleaner, less noise */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a2e,transparent_50%)] opacity-40"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_40%)] blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-5xl mx-auto flex flex-col items-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="mb-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.08] transition-colors cursor-default"
          >
            <span className="text-[13px] font-medium text-white/80">Introducing ColabMatch 2.0</span>
            <ChevronRight className="w-3 h-3 text-white/50" />
          </motion.div>

          <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-display font-semibold tracking-tighter leading-[0.95] mb-8 text-center">
            <span className="block bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 pb-2">
              Collaboration.
            </span>
            <span className="block bg-clip-text text-transparent bg-gradient-to-b from-white/90 to-white/40 pb-4">
              Reimagined.
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed font-normal tracking-tight"
          >
            The premium network for elite developers and visionaries.
            <br className="hidden md:block" />
            Build the impossible, together.
          </motion.p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Magnetic strength={30}>
              <Link
                to="/register"
                className="group relative px-8 py-4 rounded-full bg-white text-black font-medium text-lg tracking-tight overflow-hidden transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
              >
                <span className="relative z-10">Start Building</span>
              </Link>
            </Magnetic>

            <Magnetic strength={30}>
              <Link
                to="/login"
                className="group px-8 py-4 rounded-full text-white font-medium text-lg tracking-tight transition-colors flex items-center gap-2 backdrop-blur-sm bg-white/[0.05] border border-white/10 hover:bg-white/[0.1]"
              >
                Learn more <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Magnetic>
          </div>
        </motion.div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="relative z-10 py-32 px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto">
        <div className="mb-24 text-center">
          <h2 className="text-4xl md:text-6xl font-display font-semibold tracking-tighter mb-6">
            Designed for <span className="text-blue-500">Velocity</span>.
          </h2>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            Every interaction is crafted to be fluid, intuitive, and powerful.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[450px]">
          {/* Large Card - Global Network */}
          <div className="md:col-span-2 h-full">
            <TiltCard className="h-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative h-full group overflow-hidden rounded-[40px] bg-[#0A0A0A] border border-white/[0.08] p-10 hover:border-white/[0.15] transition-colors"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-100" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-3xl font-display font-medium mb-3 tracking-tight">Global Talent Network</h3>
                    <p className="text-white/50 text-lg max-w-md leading-relaxed">Access a curated pool of world-class creators. Connect instantly with the best minds across the globe.</p>
                  </div>
                  <div className="relative h-56 w-full mt-8 rounded-3xl border border-white/5 bg-black/20 overflow-hidden">
                    <NetworkGlobe />
                  </div>
                </div>
              </motion.div>
            </TiltCard>
          </div>

          {/* Tall Card - Instant Velocity */}
          <div className="md:row-span-2 h-full">
            <TiltCard className="h-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="relative h-full group overflow-hidden rounded-[40px] bg-[#0A0A0A] border border-white/[0.08] p-10 hover:border-white/[0.15] transition-colors"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-500/5" />
                <div className="relative z-10 h-full flex flex-col">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/5">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-display font-medium mb-4 tracking-tight">Instant<br />Velocity</h3>
                  <p className="text-white/50 text-lg mb-12 leading-relaxed">Accelerate your workflow with AI-driven matching and seamless collaboration tools.</p>

                  <div className="mt-auto space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        </div>
                        <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: "100%" }}
                            transition={{ duration: 1, delay: 0.5 + (i * 0.2) }}
                            className="h-full bg-blue-500/50"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </TiltCard>
          </div>

          {/* Small Card 1 - Verified */}
          <div className="h-full">
            <TiltCard className="h-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="relative h-full group overflow-hidden rounded-[40px] bg-[#0A0A0A] border border-white/[0.08] p-10 hover:border-white/[0.15] transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-display font-medium mb-3 tracking-tight">Verified Elite</h3>
                <p className="text-white/50 leading-relaxed">Every member is vetted for excellence and reliability.</p>
              </motion.div>
            </TiltCard>
          </div>

          {/* Small Card 2 - Smart Match */}
          <div className="h-full">
            <TiltCard className="h-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="relative h-full group overflow-hidden rounded-[40px] bg-[#0A0A0A] border border-white/[0.08] p-10 hover:border-white/[0.15] transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                  <Cpu className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-display font-medium mb-3 tracking-tight">Smart Match</h3>
                <p className="text-white/50 leading-relaxed">AI algorithms that understand your tech stack and culture.</p>
              </motion.div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-20 border-t border-white/5 bg-[#000000]">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-display font-bold mb-2 tracking-tight">ALLIV</h2>
            <p className="text-white/40 text-sm">© 2024 Alliv Inc.</p>
          </div>
          <div className="flex gap-8 text-sm font-medium text-white/60">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default Landing;
