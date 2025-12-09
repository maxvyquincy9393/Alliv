import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
import { LandingNavbar } from '../components/LandingNavbar';
import { 
  Shield, Globe, Sparkles, ArrowRight, Check, Laptop, MessageSquare, Users
} from 'lucide-react';
import { useRef, MouseEvent } from 'react';
import { Link } from 'react-router-dom';

// --- Shared Components (Duplicated for isolation) ---

function SpotlightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={`relative border border-white/10 bg-black/20 overflow-hidden group ${className}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(59, 130, 246, 0.1),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

const FeatureIcon = ({ icon: Icon, color }: { icon: any, color: string }) => (
  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-${color}-500/10 border border-${color}-500/20`}>
    <Icon className={`w-6 h-6 text-${color}-400`} />
  </div>
);

export const Features = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#030305] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden">
      <LandingNavbar />

      {/* --- Background --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[20%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[150px] opacity-30 mix-blend-screen animate-blob" />
         <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }} />
      </div>

      {/* --- Header --- */}
      <section className="relative z-10 pt-32 pb-20 px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                <span className="text-xs font-medium text-blue-400 tracking-wide uppercase">Everything you need</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
                The complete toolkit for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">modern builders.</span>
            </h1>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
                From intelligent matching to real-time collaboration, Alliv provides the infrastructure for your next big idea.
            </p>
          </motion.div>
      </section>

      {/* --- Feature Grid --- */}
      <section className="relative z-10 py-10 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">
            
            {/* Card 1: Real-time Collaboration (The Chat Mock) */}
            <SpotlightCard className="md:col-span-3 rounded-3xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                 <div className="p-10 flex flex-col justify-center w-full md:w-2/5 shrink-0 z-10 relative bg-black/40 backdrop-blur-sm md:bg-transparent border-r border-white/5">
                    <div>
                        <FeatureIcon icon={MessageSquare} color="blue" />
                        <h3 className="text-3xl font-bold mb-4">Contextual Chat</h3>
                        <p className="text-white/50 text-lg leading-relaxed mb-6">
                            Stop switching between Discord and Slack. Our built-in chat is designed for code. Share snippets, link repositories, and schedule meetings without leaving the platform.
                        </p>
                        <ul className="space-y-3">
                            {['Syntax highlighting', 'GitHub integration', 'Threaded replies'].map(item => (
                                <li key={item} className="flex items-center gap-2 text-sm text-white/70">
                                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-blue-400" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                
                {/* Large Chat Mock */}
                <div className="relative flex-1 bg-[#050505] flex flex-col h-[400px] md:h-auto overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/[0.02]" />
                    
                   {/* Chat Header */}
                    <div className="h-16 border-b border-white/5 flex items-center px-6 justify-between bg-white/[0.02] z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 relative">
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#050505] rounded-full"></div>
                            </div>
                            <div>
                                <div className="h-4 w-32 bg-white/20 rounded mb-1.5" />
                                <div className="h-3 w-20 bg-white/10 rounded" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Chat Messages */}
                    <div className="flex-1 p-8 space-y-6 overflow-y-auto relative z-10">
                        
                        {/* Msg 1 */}
                        <div className="flex gap-4 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 mt-1" />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-white/50">Alex R.</span>
                                    <span className="text-[10px] text-white/30">10:23 AM</span>
                                </div>
                                <div className="bg-[#1A1A1A] border border-white/5 p-4 rounded-2xl rounded-tl-none text-sm text-white/80 leading-relaxed shadow-sm">
                                    I've pushed the new authentication middleware. Can you review the PR?
                                </div>
                            </div>
                        </div>

                        {/* Msg 2 */}
                        <div className="flex gap-4 max-w-[80%] ml-auto flex-row-reverse">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                            <div className="space-y-1 text-right">
                                <div className="flex items-center justify-end gap-2 mb-1">
                                    <span className="text-[10px] text-white/30">10:25 AM</span>
                                    <span className="text-xs font-bold text-white/50">You</span>
                                </div>
                                <div className="bg-blue-600 p-4 rounded-2xl rounded-tr-none text-sm text-white leading-relaxed shadow-lg shadow-blue-900/20 text-left">
                                    On it. Also, are we still on for the deployment sync later?
                                </div>
                            </div>
                        </div>

                         {/* Msg 3 */}
                         <div className="flex gap-4 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 mt-1" />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-white/50">Alex R.</span>
                                    <span className="text-[10px] text-white/30">10:28 AM</span>
                                </div>
                                <div className="bg-[#1A1A1A] border border-white/5 p-4 rounded-2xl rounded-tl-none text-sm text-white/80 leading-relaxed shadow-sm">
                                    Yes, sent the invite. Btw, the new dashboard looks sick 🔥
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat Input */}
                    <div className="p-6 border-t border-white/5 bg-white/[0.01] z-10">
                        <div className="h-12 bg-[#111] rounded-xl flex items-center px-4 justify-between border border-white/5">
                            <div className="flex gap-4 items-center w-full">
                                <div className="w-6 h-6 rounded bg-white/5" />
                                <div className="h-2 w-48 bg-white/10 rounded" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-blue-400" />
                        </div>
                    </div>
                </div>
            </SpotlightCard>

            {/* Card 2: Matching */}
            <SpotlightCard className="md:col-span-1 rounded-3xl p-8 h-[350px] flex flex-col justify-between">
                <div>
                    <FeatureIcon icon={Sparkles} color="blue" />
                    <h3 className="text-2xl font-bold mb-3">Smart Matching</h3>
                    <p className="text-white/50">
                        Our algorithm considers technical stack, time zone availability, and project interests to find compatible co-founders.
                    </p>
                </div>
            </SpotlightCard>

            {/* Card 3: Verification */}
            <SpotlightCard className="md:col-span-1 rounded-3xl p-8 h-[350px] flex flex-col justify-between bg-gradient-to-b from-blue-900/10 to-transparent">
                <div>
                    <FeatureIcon icon={Shield} color="blue" />
                    <h3 className="text-2xl font-bold mb-3">Verified Profiles</h3>
                    <p className="text-white/50">
                        We verify GitHub contributions, LinkedIn work history, and identity so you can build with trust.
                    </p>
                </div>
            </SpotlightCard>

            {/* Card 4: Global */}
            <SpotlightCard className="md:col-span-1 rounded-3xl p-8 h-[350px] flex flex-col justify-between">
                <div>
                    <FeatureIcon icon={Globe} color="blue" />
                    <h3 className="text-2xl font-bold mb-3">Global Talent</h3>
                    <p className="text-white/50">
                         Access a worldwide network of developers, designers, and product managers ready to collaborate.
                    </p>
                </div>
            </SpotlightCard>

             {/* Card 5: Project Management */}
             <SpotlightCard className="md:col-span-2 rounded-3xl p-8 flex items-center justify-between relative overflow-hidden min-h-[300px]">
                <div className="relative z-10 max-w-md">
                    <FeatureIcon icon={Laptop} color="yellow" />
                    <h3 className="text-3xl font-bold mb-3">Project Hub</h3>
                    <p className="text-white/50 text-lg">
                        Kanban boards, milestone tracking, and file sharing built specifically for hackathons and MVPs.
                    </p>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-500/10 to-transparent" />
            </SpotlightCard>

            {/* Card 6: Community */}
             <SpotlightCard className="md:col-span-1 rounded-3xl p-8 flex flex-col justify-between min-h-[300px]">
                <div>
                    <FeatureIcon icon={Users} color="cyan" />
                    <h3 className="text-2xl font-bold mb-3">Community Events</h3>
                    <p className="text-white/50">
                        Weekly demo days, pitch practice, and expert workshops.
                    </p>
                </div>
            </SpotlightCard>

        </div>
      </section>

      {/* --- CTA --- */}
      <section className="relative z-10 py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-8">Start building today.</h2>
            <Link
              to="/register"
              className="inline-flex items-center gap-3 px-12 py-5 rounded-full bg-white text-black font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)]"
            >
              Get Started
            </Link>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="relative z-10 border-t border-white/5 bg-[#020202] pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                    <img src="/logo_alivv.png" alt="ALLIV" className="w-8 h-8 object-contain" />
                    <span className="text-xl font-bold">ALLIV</span>
                </div>
                <p className="text-white/40 text-sm max-w-xs leading-relaxed">
                    The platform for the next generation of startups. 
                    Connect, collaborate, and create something extraordinary.
                </p>
            </div>
            <div>
                <h4 className="font-bold mb-6 text-white">Platform</h4>
                <ul className="space-y-4 text-sm text-white/60">
                    <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                    <li><Link to="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
                </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex justify-between text-sm text-white/30">
            <p>© 2024 Alliv Inc.</p>
            <div className="flex gap-6">
                <a href="#" className="hover:text-white">Privacy</a>
                <a href="#" className="hover:text-white">Terms</a>
            </div>
        </div>
      </footer>
    </div>
  );
};
export default Features;
