import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../components/LandingNavbar';
import { ArrowRight, CheckCircle2, Users, Zap, Shield } from 'lucide-react';

export const Landing = () => {
  
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="relative min-h-screen bg-[#020204] text-white font-sans overflow-x-hidden selection:bg-blue-500/20">
      <LandingNavbar />

      {/* --- Background FX --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Subtle top gradient */}
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent opacity-40" />
        {/* Very subtle ambient glow in center */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      {/* --- Hero Section --- */}
      <section className="relative z-10 pt-40 pb-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-sm font-medium text-white/80 tracking-wide">The #1 Platform for Tech Co-Founders</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-8 text-white">
            Build your dream team <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              in record time.
            </span>
          </h1>

          <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with verified developers, designers, and product managers. 
            AI-driven matching to find the perfect fit for your next startup.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="h-14 px-8 rounded-full bg-white text-black font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              Start Matching Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/features"
              className="h-14 px-8 rounded-full bg-white/5 border border-white/10 text-white font-medium text-lg hover:bg-white/10 transition-colors flex items-center"
            >
              View Features
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-white/40">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              <span>Verified Profiles</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              <span>Free to Join</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              <span>Global Network</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- Trusted By (Clean) --- */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-medium text-white/30 uppercase tracking-widest mb-8">Trusted by builders from</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-40 grayscale">
             {['Y Combinator', 'Techstars', 'Antler', 'Sequoia', 'a16z'].map(name => (
               <span key={name} className="text-xl font-bold font-display">{name}</span>
             ))}
          </div>
        </div>
      </section>

      {/* --- Value Proposition (Grid) --- */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div {...fadeInUp} className="space-y-4">
               <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Users className="w-6 h-6 text-blue-400" />
               </div>
               <h3 className="text-2xl font-bold text-white">Intelligent Matching</h3>
               <p className="text-white/50 leading-relaxed">
                 Our algorithm analyzes 50+ data points including tech stack, working style, and availability to find your ideal partner, not just a resume.
               </p>
            </motion.div>

            <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="space-y-4">
               <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <Shield className="w-6 h-6 text-cyan-400" />
               </div>
               <h3 className="text-2xl font-bold text-white">Verified Identity</h3>
               <p className="text-white/50 leading-relaxed">
                 Eliminate spam and bots. Every user undergoes GitHub verification and optional ID checks to ensure high-intent collaboration.
               </p>
            </motion.div>

            <motion.div {...fadeInUp} transition={{ delay: 0.4 }} className="space-y-4">
               <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <Zap className="w-6 h-6 text-indigo-400" />
               </div>
               <h3 className="text-2xl font-bold text-white">Built for Speed</h3>
               <p className="text-white/50 leading-relaxed">
                 From chat to kanban boards, our platform provides the essential tools you need to go from idea to MVP in record time.
               </p>
            </motion.div>
         </div>
      </section>

      {/* --- Simple Stats / Social Proof --- */}
      <section className="py-20 bg-gradient-to-b from-white/5 to-transparent">
         <div className="max-w-7xl mx-auto px-6">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/5">
              {[
                { label: "Matches Created", value: "10,000+" },
                { label: "Countries", value: "150+" },
                { label: "Active Projects", value: "2,500+" },
                { label: "User Rating", value: "4.9/5" },
              ].map((stat) => (
                <div key={stat.label} className="px-4">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-sm text-white/40 font-medium uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}
           </div>
         </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-32 px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto bg-[#0A0A0C] border border-white/10 rounded-3xl p-12 md:p-20 relative overflow-hidden"
        >
           {/* Glow FX */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

           <div className="relative z-10">
             <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
               Ready to ship your next big thing?
             </h2>
             <p className="text-xl text-white/50 mb-10 max-w-lg mx-auto">
               Join thousands of founders and developers building the future.
             </p>
             <Link
                to="/register"
                className="inline-flex h-14 px-8 items-center justify-center rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition-transform"
              >
                Join for Free
              </Link>
           </div>
        </motion.div>
      </section>

      {/* --- Footer --- */}
      <footer className="border-t border-white/5 bg-[#020204] pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo_alivv.png" alt="ALLIV" className="w-8 h-8 object-contain" />
                <span className="text-xl font-bold text-white">ALLIV</span>
              </div>
              <p className="text-white/40 text-sm max-w-xs">
                Connecting the world's best builders to create products that matter.
              </p>
            </div>
            
            <div className="flex gap-16">
              <div>
                <h4 className="text-white font-bold mb-4">Product</h4>
                <ul className="space-y-3 text-sm text-white/60">
                  <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                  <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">Legal</h4>
                <ul className="space-y-3 text-sm text-white/60">
                  <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                  <li><Link to="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30">
            <p>© 2024 Alliv Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white">Twitter</a>
              <a href="#" className="hover:text-white">LinkedIn</a>
              <a href="#" className="hover:text-white">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;