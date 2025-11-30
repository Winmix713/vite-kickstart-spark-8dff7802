import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Settings, BarChart3, Zap, AlertCircle, Database, Brain, TrendingUp, Package, Layers, CheckCircle2, MessageSquare } from 'lucide-react';
interface NavItem {
  id: string;
  label: string;
  labelHu: string;
  href: string;
  icon: React.ReactNode;
}
interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}
const navItems: NavItem[] = [{
  id: 'dashboard',
  label: 'Dashboard',
  labelHu: 'Szétlátás',
  href: '/admin',
  icon: <LayoutDashboard className="w-4 h-4" />
}, {
  id: 'users',
  label: 'Users',
  labelHu: 'Felhasználók',
  href: '/admin/users',
  icon: <Users className="w-4 h-4" />
}, {
  id: 'jobs',
  label: 'Jobs',
  labelHu: 'Feladatok',
  href: '/admin/jobs',
  icon: <Zap className="w-4 h-4" />
}, {
  id: 'health',
  label: 'Health',
  labelHu: 'Egészség',
  href: '/admin/health',
  icon: <AlertCircle className="w-4 h-4" />
}, {
  id: 'monitoring',
  label: 'Monitoring',
  labelHu: 'Megfigyelés',
  href: '/admin/monitoring',
  icon: <TrendingUp className="w-4 h-4" />
}, {
  id: 'analytics',
  label: 'Analytics',
  labelHu: 'Elemzés',
  href: '/admin/analytics',
  icon: <BarChart3 className="w-4 h-4" />
}, {
  id: 'models',
  label: 'Models',
  labelHu: 'Modellek',
  href: '/admin/model-status',
  icon: <Brain className="w-4 h-4" />
}, {
  id: 'stats',
  label: 'Statistics',
  labelHu: 'Statisztika',
  href: '/admin/stats',
  icon: <BarChart3 className="w-4 h-4" />
}, {
  id: 'integrations',
  label: 'Integrations',
  labelHu: 'Integrációk',
  href: '/admin/integrations',
  icon: <Package className="w-4 h-4" />
}, {
  id: 'phase9',
  label: 'Phase 9',
  labelHu: 'Szakasz 9',
  href: '/admin/phase9',
  icon: <Layers className="w-4 h-4" />
}, {
  id: 'matches',
  label: 'Matches',
  labelHu: 'Mérkőzések',
  href: '/admin/matches',
  icon: <CheckCircle2 className="w-4 h-4" />
}, {
  id: 'predictions',
  label: 'Predictions',
  labelHu: 'Előrejelzések',
  href: '/admin/predictions',
  icon: <TrendingUp className="w-4 h-4" />
}, {
  id: 'feedback',
  label: 'Feedback',
  labelHu: 'Visszajelzés',
  href: '/admin/feedback',
  icon: <MessageSquare className="w-4 h-4" />
}, {
  id: 'environment',
  label: 'Environment',
  labelHu: 'Környezet',
  href: '/admin/environment',
  icon: <Database className="w-4 h-4" />
}, {
  id: 'settings',
  label: 'Settings',
  labelHu: 'Beállítások',
  href: '/settings',
  icon: <Settings className="w-4 h-4" />
}];

/**
 * WinmixPro Mobile Menu
 * Responsive mobile navigation drawer
 */
export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose
}) => {
  const location = useLocation();
  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };
  if (!isOpen) return null;
  return <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={onClose} />

      {/* Menu */}
      <div className="fixed top-16 left-0 bottom-0 z-50 w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 overflow-y-auto md:hidden">
        <nav className="p-4 space-y-2">
          {navItems.map(item => <Link key={item.id} to={item.href} onClick={onClose} className={cn('flex items-center gap-3 px-4 py-3 rounded-lg', 'transition-all duration-200', 'text-sm font-medium', isActive(item.href) ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10')}>
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.labelHu}</span>
            </Link>)}
        </nav>
      </div>
    </>;
};
export default MobileMenu;