import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../components/LandingNavbar';

const heroStats = [
  { label: 'Active Collaborators', value: '1.2k+' },
  { label: 'Avg. Match Time', value: '< 5 min' },
  { label: 'Projects Launched', value: '280+' },
];

const queuePeek = [
  { name: 'Sarah Chen', craft: 'Frontend Dev · React/TypeScript', slot: 'Available now' },
  { name: 'Ahmad Rizki', craft: 'UI/UX Designer · Figma Pro', slot: 'Evening slot' },
];

const pillars = [
  {
    title: 'Smart Matching',
    copy: 'AI-powered algorithm matches you by skills, goals, and availability for perfect collaboration.',
  },
  {
    title: 'Rich Profiles',
    copy: 'Portfolio, tech stack, past projects, and work style—all the info you need for quick decisions.',
  },
  {
    title: 'Real-time Chat',
    copy: 'Responsive messaging with file sharing, code snippets, and integrated project tracking.',
  },
];

const steps = [
  {
    title: 'Build Your Profile',
    copy: 'Showcase your skills, expertise, portfolio, and project goals. Let our AI understand who matches with you.',
  },
  {
    title: 'Discover & Match',
    copy: 'Swipe to find potential collaborators. Like if interested, skip if not—simple and efficient.',
  },
  {
    title: 'Collaborate & Ship',
    copy: 'Chat directly, brainstorm ideas, share resources, and start building your dream project with the right team.',
  },
];

const trustCards = [
  { title: 'Verified Profiles', copy: 'Every user is verified to ensure credibility and professionalism.' },
  { title: 'Secure Communication', copy: 'End-to-end encryption for all conversations and file sharing.' },
  { title: 'Rating System', copy: 'Reviews and ratings from previous collaborations for full transparency.' },
  { title: 'Smart Moderation', copy: 'AI moderation keeps the collaboration environment professional and safe.' },
];

export const Landing = () => {
  return (
    <div className="relative min-h-screen bg-[#04040a] text-white">
      <LandingNavbar />
      <main className="space-y-10 pb-10 pt-20 md:space-y-14 md:pb-14 md:pt-24">
        <Hero />
        <Pillars />
        <Steps />
        <Trust />
        <Footer />
      </main>
    </div>
  );
};

const Hero = () => (
  <section className="shell-content grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
    <div className="space-y-4 md:space-y-5">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
        Alliv · Beta Launch
      </span>
      <h1 className="text-4xl font-semibold leading-tight sm:text-5xl md:text-[3.4rem] md:leading-[1.05]">
        Find the best collaborators for your next project.
      </h1>
      <p className="text-lg text-white/70">
        Alliv connects developers, designers, and creators to build something amazing together. 
        Smart matching, real-time collaboration, zero hassle.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/register"
          className="inline-flex items-center justify-center rounded-full bg-white/90 px-8 py-3 text-base font-semibold text-black transition-all hover:bg-white hover:-translate-y-0.5"
        >
          Get Started
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3 text-base font-semibold text-white/75 hover:text-white hover:border-white/40"
        >
          Sign In
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {heroStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5">
            <p className="text-2xl font-semibold text-white">{stat.value}</p>
            <p className="text-xs uppercase tracking-[0.35em] text-white/55">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
    <HeroCard />
  </section>
);

const HeroCard = () => (
  <div className="flex h-full flex-col rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.6)] md:p-6">
    <div className="flex items-center justify-between text-xs text-white/60">
      <span>Active collaborators</span>
      <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-green-400">
        Live
      </span>
    </div>
    <div className="mt-4 flex-1 space-y-3">
      {queuePeek.map((match) => (
        <div
          key={match.name}
          className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition-all hover:border-white/20 hover:bg-black/30"
        >
          <div>
            <p className="font-semibold">{match.name}</p>
            <p className="text-xs text-white/60">{match.craft}</p>
          </div>
          <p className="text-xs font-medium text-green-400">{match.slot}</p>
        </div>
      ))}
    </div>
    <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm">
      <p className="font-semibold text-white">Quick tip</p>
      <p className="mt-1 text-xs text-white/70">Complete your profile & portfolio to get 3x more matches.</p>
    </div>
  </div>
);

const Pillars = () => (
  <section className="shell-content space-y-5">
    <div className="text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">Why Alliv</p>
      <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
        Collaboration platform designed for creators.
      </h2>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {pillars.map((pillar) => (
        <motion.div
          key={pillar.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/70"
        >
          <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
          <p className="mt-2">{pillar.copy}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

const Steps = () => (
  <section className="shell-content space-y-5" id="learn">
    <div className="text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">How It Works</p>
      <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
        Three steps to start collaborating.
      </h2>
    </div>
    <ol className="grid gap-4 md:grid-cols-3">
      {steps.map((step, index) => (
        <motion.li
          key={step.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/70"
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/50">
            <span>Step {index + 1}</span>
            <span>Alliv</span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">{step.title}</h3>
          <p className="mt-2">{step.copy}</p>
        </motion.li>
      ))}
    </ol>
  </section>
);

const Trust = () => (
  <section className="shell-content space-y-5" id="trust">
    <div className="text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">Security & Trust</p>
      <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Safe and trusted collaboration.</h2>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {trustCards.map((card) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/70"
        >
          <h3 className="text-lg font-semibold text-white">{card.title}</h3>
          <p className="mt-2">{card.copy}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

const Footer = () => (
  <footer className="shell-content border-t border-white/10 pt-10 text-center text-xs text-white/60">
    <p>&copy; {new Date().getFullYear()} Alliv. Built for limitless collaboration.</p>
    <div className="mt-4 flex justify-center gap-6">
      <a href="#" className="transition-colors hover:text-white">Privacy Policy</a>
      <a href="#" className="transition-colors hover:text-white">Terms of Service</a>
      <a href="#" className="transition-colors hover:text-white">Support</a>
      <a href="#" className="transition-colors hover:text-white">Contact</a>
    </div>
    <div className="mt-6 flex justify-center gap-4 text-sm">
      <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
        Made with love in Indonesia
      </span>
    </div>
  </footer>
);
