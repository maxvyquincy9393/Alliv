import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { MobileTopBar } from './MobileTopBar';

interface LayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <MobileTopBar />
      <main className="relative pt-16 md:pt-0 pb-20 md:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
};
