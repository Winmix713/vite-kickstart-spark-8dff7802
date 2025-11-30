import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Menu, X, LogOut, Settings } from 'lucide-react';
interface HeaderProps {
  onMobileMenuToggle?: () => void;
  className?: string;
  userEmail?: string;
  onLogout?: () => void;
}

/**
 * WinmixPro Header
 * Premium glass-morphism header with responsive mobile menu toggle
 */
export const Header: React.FC<HeaderProps> = ({
  onMobileMenuToggle,
  className,
  userEmail,
  onLogout
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  return <header className={cn('sticky top-0 z-40', 'bg-white/5 backdrop-blur-xl border-b border-white/10', 'h-16 flex items-center justify-between px-4 md:px-6', 'transition-all duration-200', className)}>
      {/* Left section - Logo/Brand */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-emerald-400 to-violet-400 bg-clip-text text-transparent">
          WinmixPro
        </h1>
      </div>

      {/* Right section - Navigation & User Menu */}
      <div className="flex items-center gap-4">
        {/* User menu - visible on desktop */}
        <div className="hidden md:flex items-center gap-2 relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors duration-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold">
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-sm text-white/80">{userEmail || 'User'}</span>
          </button>

          {/* User dropdown */}
          {showUserMenu && <div className="absolute top-full right-0 mt-2 w-48 glass-panel py-2 shadow-glass-lg">
              <a href="#settings" className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition-colors duration-200 text-sm">
                <Settings className="w-4 h-4" />
                Settings
              </a>
              {onLogout && <button onClick={() => {
            onLogout();
            setShowUserMenu(false);
          }} className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition-colors duration-200 text-sm text-red-400">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>}
            </div>}
        </div>

        {/* Mobile menu toggle */}
        <button onClick={onMobileMenuToggle} className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors duration-200" aria-label="Toggle menu">
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>;
};
export default Header;