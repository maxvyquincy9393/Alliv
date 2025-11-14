import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { MobileTopBar } from './MobileTopBar';

interface LayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
  showMobileChrome?: boolean;
  padded?: boolean;
}

export const Layout = ({
  children,
  showNavbar = true,
  showMobileChrome = true,
  padded = true,
}: LayoutProps) => {
  return (
    <div className="page-shell relative bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(140,111,247,0.25),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(53,245,255,0.12),_transparent_55%)] mix-blend-screen" />
      </div>

      {showNavbar && <Navbar />}
      {showMobileChrome && <MobileTopBar />}

      <main className="relative flex-1 pt-16 md:pt-20">
        <div
          className={`w-full mx-auto ${padded ? 'max-w-6xl px-3 sm:px-4 lg:px-6 py-4 md:py-6' : ''}`}
        >
          {children}
        </div>
      </main>

      {showMobileChrome && <MobileNav />}
    </div>
  );
};
