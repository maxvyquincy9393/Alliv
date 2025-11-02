import { ReactNode } from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
}

export const Layout = ({ children, showNavbar = true }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-surface text-white">
      {showNavbar && <Navbar />}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};
