import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../components/LandingNavbar';

const features = [
  {
    title: 'Smart matching',
    description:
      'Skills, goals, and availability are combined so you only meet collaborators that fit your flow.',
  },
  {
    title: 'Live discovery',
    description:
      'Switch between nearby makers or async discovery without leaving the map experience.',
  },
  {
    title: 'Trust-first',
    description:
      'Verified profiles, visible scores, and gentle nudges keep the community respectful and focused.',
  },
];

const steps = [
  {
    title: 'Create your profile',
    description: 'Share your craft, highlight tools you love, and drop a short availability note.',
  },
  {
    title: 'Discover & swipe',
    description: 'Use map or swipe view to find collaborators. Pin promising matches or start a chat.',
  },
  {
    title: 'Ship together',
    description:
      'Spin up project rooms, share files, track sessions, and let the platform remind you of next steps.',
  },
];

const trust = [
  { title: 'Verified profiles', copy: 'Document + selfie check before first collaboration.' },
  { title: 'Conversation health', copy: 'Smart moderation flags keep DMs positive.' },
  { title: 'Transparent reviews', copy: 'End of project feedback raises real stars, not vanity points.' },
  { title: 'Fast support', copy: 'Humans on standby whenever you need to report or pause a chat.' },
];

export const Landing = () => {
  return (
    <div className="relative min-h-screen text-[var(--color-text)]">
      <LandingNavbar />
      <main className="pt-28 pb-16 space-y-20">
        <Hero />
        <FeatureGrid />
        <HowItWorks />
        <Safety />
        <Footer />
      </main>
    </div>
  );
};

const Hero = () => (
  <section className="shell-content flex flex-col items-center text-center gap-10">
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center gap-6 w-full"
    >
      <span className="pill text-[var(--color-text-muted)]">
        <span className="w-2 h-2 rounded-full bg-[var(--color-highlight)] block" />
        Collaboration, simplified
      </span>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight">
        Meet collaborators you can actually build with.
      </h1>
      <p className="max-w-2xl text-lg text-[var(--color-text-muted)]">
        Alivv pairs smart discovery with gentle structure so every chat moves toward a real project.
        Keep everything in one calm workspace, no chaos required.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
        <Link
          to="/register"
          className="inline-flex justify-center items-center rounded-full px-8 py-3 bg-white text-black font-semibold shadow-[0_20px_40px_rgba(15,23,42,0.35)] hover:-translate-y-0.5"
        >
          Get started
        </Link>
        <Link
          to="/login"
          className="inline-flex justify-center items-center rounded-full px-8 py-3 border border-white/30 text-white font-semibold hover:bg-white/5"
        >
          I already have an account
        </Link>
      </div>
    </motion.div>
    <div className="panel subtle-grid w-full max-w-5xl mx-auto p-6 sm:p-10 text-left">
      <p className="text-base sm:text-lg text-[var(--color-text-muted)] leading-relaxed">
        <span className="text-white font-semibold">&ldquo;</span>Two weeks into private beta we matched
        over 280 creatives into projects with real deliverables. No job boards, just thoughtful
        intros and a calm chat space.<span className="text-white font-semibold">&rdquo;</span>
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[
          { label: 'Successful matches', value: '280+' },
          { label: 'Avg. reply time', value: '12 min' },
          { label: 'Verified creators', value: '3.5k' },
          { label: 'Active countries', value: '26' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/5 p-4">
            <p className="text-2xl font-semibold">{stat.value}</p>
            <p className="text-sm text-[var(--color-text-muted)]">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FeatureGrid = () => (
  <section className="shell-content space-y-10" id="learn">
    <div className="section-heading">
      <span>Why Alivv</span>
      <h2>Design-led tools for intentional collabs.</h2>
    </div>
    <div className="grid gap-6 md:grid-cols-3">
      {features.map((feature) => (
        <motion.div
          key={feature.title}
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          viewport={{ once: true }}
          className="panel p-6 subtle-grid"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-3">
            {feature.title}
          </p>
          <p className="text-lg leading-relaxed text-[var(--color-text-muted)]">{feature.description}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

const HowItWorks = () => (
  <section className="shell-content space-y-10" id="safety">
    <div className="section-heading">
      <span>Flow</span>
      <h2>Start light, stay organized, move forward.</h2>
    </div>
    <div className="grid gap-6 md:grid-cols-3">
      {steps.map((step, idx) => (
        <motion.div
          key={step.title}
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: idx * 0.05 }}
          viewport={{ once: true }}
          className="panel p-6 flex flex-col gap-4"
        >
          <span className="pill w-fit bg-white/10 border-white/20 text-white">
            Step {idx + 1}
          </span>
          <h3 className="text-xl font-semibold">{step.title}</h3>
          <p className="text-[var(--color-text-muted)]">{step.description}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

const Safety = () => (
  <section className="shell-content space-y-10">
    <div className="section-heading">
      <span>Trust</span>
      <h2>Safety built into every message.</h2>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {trust.map((item) => (
        <motion.div
          key={item.title}
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 16 }}
          viewport={{ once: true }}
          className="panel p-5"
        >
          <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
          <p className="text-[var(--color-text-muted)] text-sm">{item.copy}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

const Footer = () => (
  <footer className="shell-content pt-10 border-t border-white/5">
    <div className="flex flex-col gap-3 text-center text-[var(--color-text-muted)] text-sm">
      <p>&copy; {new Date().getFullYear()} Alivv. Built for founders, strategists, and multi-hyphenates.</p>
      <div className="flex flex-wrap justify-center gap-4 uppercase tracking-[0.2em] text-xs">
        <span>Privacy</span>
        <span>Security</span>
        <span>Community</span>
      </div>
    </div>
  </footer>
);
