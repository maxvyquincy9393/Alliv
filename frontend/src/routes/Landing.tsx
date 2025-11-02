import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../components/LandingNavbar';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden">
      <LandingNavbar />
      
      {/* Hero Section - Apple Style */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Logo */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-semibold mb-6 tracking-tight"
          >
            Alliv
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl sm:text-2xl md:text-3xl text-gray-600 mb-12 px-4"
          >
            Connect with creative minds.<br className="sm:hidden" /> Build something amazing.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4"
          >
            <Link to="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-3 bg-black text-white rounded-full text-lg font-medium hover:bg-gray-800 transition-colors">
                Get Started
              </button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-3 border-2 border-black text-black rounded-full text-lg font-medium hover:bg-gray-50 transition-colors">
                Sign In
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            <FeatureCard
              title="Smart Matching"
              description="AI-powered compatibility that connects you with the right collaborators based on skills, interests, and goals."
            />
            <FeatureCard
              title="Discover Nearby"
              description="Find talented professionals online or in your area with intelligent location-based search."
            />
            <FeatureCard
              title="Verified & Secure"
              description="Trust scores and verified profiles ensure you're connecting with real, professional creatives."
            />
          </motion.div>
        </div>
      </section>

      {/* Learn Section */}
      <section id="learn" className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold mb-6">
              Learn & Grow
            </h2>
            <p className="text-xl text-gray-600 mb-8 px-4">
              Discover resources, tutorials, and best practices to maximize your collaboration experience. 
              Connect with mentors, join workshops, and access exclusive content designed to help you succeed.
            </p>
            <Link to="/register">
              <button className="px-8 py-3 bg-black text-white rounded-full text-lg font-medium hover:bg-gray-800 transition-colors">
                Start Learning
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold mb-6">
              Your Safety Matters
            </h2>
            <p className="text-xl text-gray-600 mb-8 px-4">
              We prioritize your security and privacy. All profiles are verified, communications are monitored 
              for safety, and our trust score system helps you make informed decisions about who to collaborate with.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mt-12">
              <div className="p-6 bg-white rounded-2xl">
                <h3 className="text-lg font-semibold mb-2">Verified Profiles</h3>
                <p className="text-gray-600">Every user goes through identity verification</p>
              </div>
              <div className="p-6 bg-white rounded-2xl">
                <h3 className="text-lg font-semibold mb-2">Trust Scores</h3>
                <p className="text-gray-600">Transparent ratings from real collaborations</p>
              </div>
              <div className="p-6 bg-white rounded-2xl">
                <h3 className="text-lg font-semibold mb-2">Secure Messaging</h3>
                <p className="text-gray-600">End-to-end encrypted communications</p>
              </div>
              <div className="p-6 bg-white rounded-2xl">
                <h3 className="text-lg font-semibold mb-2">24/7 Support</h3>
                <p className="text-gray-600">Our team is always here to help</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2025 Alliv. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  title: string;
  description: string;
}

const FeatureCard = ({ title, description }: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <h3 className="text-2xl font-semibold mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  );
};
