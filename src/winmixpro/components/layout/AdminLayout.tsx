import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileMenu from './MobileMenu';
interface AdminLayoutProps {
  children: React.ReactNode;
  className?: string;
  userEmail?: string;
  onLogout?: () => void;
}

/**
 * WinmixPro AdminLayout
 * Complete premium layout shell with header, sidebar, and responsive mobile drawer
 * Enforces 12-column responsive grid with 3-6-3 desktop layout
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  className,
  userEmail,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return <div className="min-h-screen bg-winmix-dark flex flex-col">
      {/* Header */}
      <Header onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} userEmail={userEmail} onLogout={onLogout} />

      {/* Main content container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - hidden on mobile */}
        <Sidebar />

        {/* Mobile menu - visible on mobile only */}
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        {/* Main content area */}
        <main className={cn('flex-1 overflow-y-auto', 'md:ml-72 lg:ml-80', 'p-4 md:p-6 lg:p-8', 'transition-all duration-300', className)}>
          {/* Content wrapper with responsive grid support */}
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>;
};
export default AdminLayout;