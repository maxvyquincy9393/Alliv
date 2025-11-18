import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { MobileTopBar } from './MobileTopBar';

interface LayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
  showMobileChrome?: boolean;
  padded?: boolean;
  backgroundVariant?: 'default' | 'mono';
}

export const Layout = ({
  children,
  showNavbar = true,
  showMobileChrome = true,
  padded = true,
  backgroundVariant = 'default',
}: LayoutProps) => {
  return (
    <div className="page-shell relative bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        {backgroundVariant === 'mono' ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_110%,_rgba(0,0,0,0.7),_transparent_60%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,3,0.92),rgba(6,6,6,0.85))]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(140,111,247,0.25),_transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(53,245,255,0.12),_transparent_55%)] mix-blend-screen" />
          </>
        )}
      </div>

      {showNavbar && <Sidebar />}
      {showMobileChrome && <MobileTopBar />}

      <main className={`relative flex-1 transition-all duration-300 ${showNavbar ? 'md:pl-72' : ''}`}>
        <div
          className={`w-full mx-auto pt-20 md:pt-8 ${padded ? 'max-w-7xl px-4 sm:px-6 lg:px-8 py-6' : ''}`}
        >
          {children}
        </div>
      </main>

      {showMobileChrome && <MobileNav />}
    </div>
  );
};
