import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GlassButton } from '../components/GlassButton';
import { fadeInUp, stagger, pageTransition } from '../lib/motion';

export const Landing = () => {
  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="show"
      exit="exit"
      className="min-h-screen flex flex-col items-center justify-center px-4 relative"
    >
      <motion.div 
        variants={stagger(0.1)}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto text-center flex-1 flex flex-col justify-center"
      >
        {/* Logo with pulse effect */}
        <motion.div
          variants={fadeInUp}
          className="mb-12"
        >
          <motion.h1
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-[4rem] md:text-[6rem] font-bold text-white mb-4"
            style={{
              textShadow: '0 0 30px rgba(110, 158, 255, 0.8), 0 0 60px rgba(110, 158, 255, 0.4), 0 0 90px rgba(110, 158, 255, 0.2)',
            }}
          >
            Alliv
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-white/80 mb-2"
          >
            AI-powered collaboration. Temuin teman buat project abrengmu.
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="h-0.5 w-48 mx-auto bg-gradient-to-r from-transparent via-accent-blue to-transparent shadow-glow-blue"
          />
        </motion.div>

        {/* Hero Text */}
        <motion.div variants={fadeInUp}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
            Find. Connect. Build Together.
          </h2>
          <p className="text-base text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            Platform kolaborasi profesional. Match dengan developers, designers,
            photographers, musicians, dan visionaries yang siap berkarya.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto"
        >
          <Link to="/register" className="w-full sm:w-auto">
            <GlassButton variant="primary" fullWidth>
              Create Account
            </GlassButton>
          </Link>

          <Link to="/login" className="w-full sm:w-auto">
            <GlassButton variant="secondary" fullWidth>
              Log In
            </GlassButton>
          </Link>
        </motion.div>

        {/* Features */}
        <motion.div
          variants={stagger(0.15)}
          initial="hidden"
          animate="show"
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <FeatureCard
            title="Smart Matching"
            description="AI-powered compatibility across skills, interests, and goals"
          />
          <FeatureCard
            title="Dual Discovery"
            description="Find collaborators online or nearby with location-based search"
          />
          <FeatureCard
            title="Safe & Real"
            description="Verified profiles, trust scores, and professional community"
          />
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1 }}
        className="absolute bottom-6 text-center"
      >
        <a 
          href="https://x.ai" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white/40 text-sm hover:text-white/60 transition-colors"
        >
          Powered by xAI
        </a>
      </motion.footer>
    </motion.div>
  );
};

interface FeatureCardProps {
  title: string;
  description: string;
}

const FeatureCard = ({ title, description }: FeatureCardProps) => {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        transition: { type: 'spring', stiffness: 300 }
      }}
      className="p-6 glass rounded-2xl shadow-glass hover:shadow-glow-blue transition-shadow"
    >
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/40 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
};
