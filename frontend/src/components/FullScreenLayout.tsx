import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { MobileTopBar } from './MobileTopBar';
import { motion } from 'framer-motion';

interface FullScreenLayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
  showMobileChrome?: boolean;
  className?: string;
}

export const FullScreenLayout = ({
  children,
  showNavbar = true,
  showMobileChrome = true,
  className = '',
}: FullScreenLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1C] via-[#1A1F3A] to-[#0D1117] text-white overflow-hidden">
      {/* Animated background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(120,119,198,0.15),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(255,119,198,0.1),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(53,245,255,0.05),_transparent_70%)]" />
      </div>

      {/* Navigation */}
      {showNavbar && <Navbar />}
      {showMobileChrome && <MobileTopBar />}

      {/* Full screen content */}
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`relative min-h-screen flex flex-col ${
          showNavbar ? 'md:pt-20' : ''
        } ${
          showMobileChrome ? 'pt-16 pb-20 md:pb-0' : ''
        } ${className}`}
      >
        {children}
      </motion.main>

      {/* Mobile bottom navigation */}
      {showMobileChrome && <MobileNav />}
    </div>
  );
};
