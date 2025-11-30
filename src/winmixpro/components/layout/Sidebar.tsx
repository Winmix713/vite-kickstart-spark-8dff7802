import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Settings, BarChart3, Zap, AlertCircle, Database, Brain, TrendingUp, Package, Layers, CheckCircle2, MessageSquare, ChevronRight } from 'lucide-react';
interface NavItem {
  id: string;
  label: string;
  labelHu: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}
interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}
const navItems: NavItem[] = [{
  id: 'dashboard',
  label: 'Dashboard',
  labelHu: 'Szétlátás',
  href: '/admin',
  icon: <LayoutDashboard className="w-5 h-5" />
}, {
  id: 'users',
  label: 'Users',
  labelHu: 'Felhasználók',
  href: '/admin/users',
  icon: <Users className="w-5 h-5" />
}, {
  id: 'jobs',
  label: 'Jobs',
  labelHu: 'Feladatok',
  href: '/admin/jobs',
  icon: <Zap className="w-5 h-5" />
}, {
  id: 'health',
  label: 'Health',
  labelHu: 'Egészség',
  href: '/admin/health',
  icon: <AlertCircle className="w-5 h-5" />
}, {
  id: 'monitoring',
  label: 'Monitoring',
  labelHu: 'Megfigyelés',
  href: '/admin/monitoring',
  icon: <TrendingUp className="w-5 h-5" />
}, {
  id: 'analytics',
  label: 'Analytics',
  labelHu: 'Elemzés',
  href: '/admin/analytics',
  icon: <BarChart3 className="w-5 h-5" />
}, {
  id: 'models',
  label: 'Models',
  labelHu: 'Modellek',
  href: '/admin/model-status',
  icon: <Brain className="w-5 h-5" />
}, {
  id: 'stats',
  label: 'Statistics',
  labelHu: 'Statisztika',
  href: '/admin/stats',
  icon: <BarChart3 className="w-5 h-5" />
}, {
  id: 'integrations',
  label: 'Integrations',
  labelHu: 'Integrációk',
  href: '/admin/integrations',
  icon: <Package className="w-5 h-5" />
}, {
  id: 'phase9',
  label: 'Phase 9',
  labelHu: 'Szakasz 9',
  href: '/admin/phase9',
  icon: <Layers className="w-5 h-5" />
}, {
  id: 'matches',
  label: 'Matches',
  labelHu: 'Mérkőzések',
  href: '/admin/matches',
  icon: <CheckCircle2 className="w-5 h-5" />
}, {
  id: 'predictions',
  label: 'Predictions',
  labelHu: 'Előrejelzések',
  href: '/admin/predictions',
  icon: <TrendingUp className="w-5 h-5" />
}, {
  id: 'feedback',
  label: 'Feedback',
  labelHu: 'Visszajelzés',
  href: '/admin/feedback',
  icon: <MessageSquare className="w-5 h-5" />
}, {
  id: 'environment',
  label: 'Environment',
  labelHu: 'Környezet',
  href: '/admin/environment',
  icon: <Database className="w-5 h-5" />
}, {
  id: 'settings',
  label: 'Settings',
  labelHu: 'Beállítások',
  href: '/settings',
  icon: <Settings className="w-5 h-5" />
}];

/**
 * WinmixPro Sidebar
 * Premium glass-morphism sidebar with Hungarian navigation labels
 */
export const Sidebar: React.FC<SidebarProps> = ({
  className,
  isCollapsed = false,
  onCollapse
}) => {
  const location = useLocation();
  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };
  return <aside className={cn('hidden md:flex flex-col', 'fixed left-0 top-16 bottom-0', 'w-64 md:w-72 lg:w-80', 'bg-white/5 backdrop-blur-xl border-r border-white/10', 'overflow-y-auto', 'transition-all duration-300', className)}>
      <nav className="flex-1 px-3 py-6 space-y-2">
        {navItems.map(item => <Link key={item.id} to={item.href} className={cn('flex items-center gap-3 px-4 py-3 rounded-lg', 'transition-all duration-200', 'text-sm font-medium', isActive(item.href) ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10')} title={item.labelHu}>
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="flex-1 truncate">{item.labelHu}</span>
            {item.badge !== undefined && <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                {item.badge}
              </span>}
            {isActive(item.href) && <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" />}
          </Link>)}
      </nav>

      {/* Footer section */}
      <div className="p-4 border-t border-white/10">
        <div className="glass-panel p-3 text-center">
          <p className="text-xs text-white/60">WinmixPro Admin</p>
          <p className="text-xs text-white/40 mt-1">v1.0</p>
        </div>
      </div>
    </aside>;
};
export default Sidebar;