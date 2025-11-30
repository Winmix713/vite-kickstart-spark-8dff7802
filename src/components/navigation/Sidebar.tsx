import { Home, Users, Calendar as CalendarIcon, Trophy, Settings, Sparkles, Clock, Brain, LayoutDashboard, ListChecks, LineChart, FlaskConical, Network, Activity, Shield, Key, Bot, Gauge, BarChart3, TrendingUp } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { usePhaseFlags } from "@/hooks/usePhaseFlags";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";
import React from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

// Icon mapping for navigation items
const iconMap = {
  home: Home,
  dashboard: LayoutDashboard,
  analytics: LineChart,
  aiChat: Bot,
  patterns: Shield,
  predictionsNew: Sparkles,
  predictions: ListChecks,
  teams: Users,
  matches: CalendarIcon,
  jobs: Clock,
  models: FlaskConical,
  crossleague: Network,
  monitoring: Activity,
  leagues: Trophy,
  phase9: Brain,
  adminJobs: Clock,
  adminModels: FlaskConical,
  adminMatches: CalendarIcon,
  adminMonitoring: Activity,
  modelStatus: Gauge,
  adminEnvironment: Key,
  adminDashboard: BarChart3,
  predictionAnalyzer: TrendingUp
} as const;
type IconKey = keyof typeof iconMap;

// Navigation item configuration
interface NavItem {
  key: IconKey;
  to: string;
  label: string;
  requiredRoles?: UserRole[];
  phase?: number;
  isDivider?: boolean;
}
const navigationItems: NavItem[] = [
// Main navigation
{
  key: 'home',
  to: '/',
  label: 'Home'
}, {
  key: 'dashboard',
  to: '/dashboard',
  label: 'Dashboard'
}, {
  key: 'analytics',
  to: '/analytics',
  label: 'Analytics'
}, {
  key: 'aiChat',
  to: '/ai-chat',
  label: 'AI Chat'
},
// Phase-based features
{
  key: 'patterns',
  to: '/patterns',
  label: 'Patterns',
  phase: 5
}, {
  key: 'predictionsNew',
  to: '/predictions/new',
  label: 'New Prediction'
}, {
  key: 'predictions',
  to: '/predictions',
  label: 'Predictions'
}, {
  key: 'teams',
  to: '/teams',
  label: 'Teams'
}, {
  key: 'matches',
  to: '/matches',
  label: 'Matches'
}, {
  key: 'jobs',
  to: '/jobs',
  label: 'Jobs'
}, {
  key: 'models',
  to: '/models',
  label: 'Models',
  phase: 6
}, {
  key: 'crossleague',
  to: '/crossleague',
  label: 'Cross-League',
  phase: 7
}, {
  key: 'monitoring',
  to: '/monitoring',
  label: 'Monitoring',
  phase: 8
}, {
  key: 'predictionAnalyzer',
  to: '/prediction-analyzer',
  label: 'Prediction Analyzer',
  phase: 8
}, {
  key: 'leagues',
  to: '/leagues',
  label: 'Leagues'
}, {
  key: 'phase9',
  to: '/phase9',
  label: 'Phase 9',
  phase: 9
},
// Divider
{
  key: 'adminDashboard',
  to: '/admin',
  label: 'Admin',
  isDivider: true,
  requiredRoles: ['admin', 'analyst']
},
// Admin navigation
{
  key: 'adminJobs',
  to: '/admin/jobs',
  label: 'Job Management',
  requiredRoles: ['admin', 'analyst']
}, {
  key: 'adminModels',
  to: '/admin/models',
  label: 'Model Management',
  requiredRoles: ['admin', 'analyst']
}, {
  key: 'adminMatches',
  to: '/admin/matches',
  label: 'Match Management',
  requiredRoles: ['admin', 'analyst']
}, {
  key: 'adminMonitoring',
  to: '/admin/monitoring',
  label: 'System Monitoring',
  requiredRoles: ['admin', 'analyst']
}, {
  key: 'modelStatus',
  to: '/admin/model-status',
  label: 'Model Status',
  requiredRoles: ['admin', 'analyst']
}, {
  key: 'adminEnvironment',
  to: '/admin/environment',
  label: 'Environment',
  requiredRoles: ['admin']
}];

// Small helper to render a consistent nav icon link
function NavIconLink({
  to,
  Icon,
  label,
  isActive,
  isDisabled = false
}: {
  to: string;
  Icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  isActive: boolean;
  isDisabled?: boolean;
}) {
  const linkBase = "h-11 w-11 grid place-items-center rounded-xl transition-all relative group";
  const activeClasses = "bg-primary/15 ring-1 ring-primary/30 hover:ring-primary/40";
  const inactiveClasses = "bg-card ring-1 ring-border hover:bg-muted hover:ring-primary/30";
  const disabledClasses = "opacity-50 cursor-not-allowed";
  const link = <NavLink to={to} className={({
    isActive: linkActive
  }) => cn(linkBase, isActive ? activeClasses : inactiveClasses, isDisabled && disabledClasses)} title={label}>
      {linkActive => <>
          <Icon className={cn("w-5 h-5 transition-colors", isActive || linkActive ? "text-primary" : "text-muted-foreground")} />
          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {label}
          </div>
        </>}
    </NavLink>;
  return isDisabled ? <div className={cn(linkBase, disabledClasses)} title={label}>
      <Icon className="w-5 h-5 text-muted-foreground" />
    </div> : link;
}
const Sidebar: React.FC = () => {
  const {
    isPhase5Enabled,
    isPhase6Enabled,
    isPhase7Enabled,
    isPhase8Enabled,
    isPhase9Enabled
  } = usePhaseFlags();
  const {
    hasAnyRole
  } = useAuth();
  const location = useLocation();

  // Phase flag mapping
  const phaseFlags = {
    5: isPhase5Enabled,
    6: isPhase6Enabled,
    7: isPhase7Enabled,
    8: isPhase8Enabled,
    9: isPhase9Enabled
  } as const;

  // Filter navigation items based on user permissions and phase flags
  const filteredItems = navigationItems.filter(item => {
    // Check role requirements
    if (item.requiredRoles && !hasAnyRole(item.requiredRoles)) {
      return false;
    }

    // Check phase requirements
    if (item.phase && !phaseFlags[item.phase as keyof typeof phaseFlags]) {
      return false;
    }
    return true;
  });

  // Group items by section (before and after divider)
  const mainItems = filteredItems.filter(item => !item.isDivider);
  const adminItems = filteredItems.filter(item => item.requiredRoles && item.requiredRoles.includes('admin'));
  return <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed z-40 top-0 left-0 h-screen w-16 flex-col justify-between py-6 border-r border-border bg-background/50 backdrop-blur">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <NavLink to="/" className="group">
            <div className="h-9 w-9 rounded-xl bg-card ring-1 ring-border grid place-items-center text-primary text-[10px] font-semibold tracking-tight hover:ring-primary/30 transition-all">
              WT
            </div>
          </NavLink>
          
          {/* Main navigation */}
          <div className="mt-4 flex flex-col items-center gap-3">
            {mainItems.map(item => {
            const Icon = iconMap[item.key];
            const isActive = location.pathname === item.to || item.to !== '/' && location.pathname.startsWith(item.to);
            return <NavIconLink key={item.to} to={item.to} Icon={Icon} label={item.label} isActive={isActive} />;
          })}
          </div>
        </div>

        {/* Bottom section */}
        <div className="px-4 flex flex-col items-center gap-3">
          {/* Admin section divider */}
          {adminItems.length > 0 && <div className="w-full h-px bg-border my-2" />}
          
          {/* Admin navigation */}
          {adminItems.map(item => {
          const Icon = iconMap[item.key];
          const isActive = location.pathname === item.to || item.to !== '/' && location.pathname.startsWith(item.to);
          return <NavIconLink key={item.to} to={item.to} Icon={Icon} label={item.label} isActive={isActive} />;
        })}

          {/* Theme Toggle */}
          <div className="my-2">
            <ThemeToggle />
          </div>

          {/* Settings */}
          <NavIconLink to="/admin/settings" Icon={Settings} label="Settings" isActive={location.pathname === '/admin/settings'} />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <div className="md:hidden fixed inset-0 z-50 lg:hidden">
        {/* Mobile sidebar would go here - for now we'll keep the existing mobile implementation */}
        <div className="fixed inset-x-0 bottom-0 z-50 bg-background/80 backdrop-blur border-t border-border">
          <div className="flex justify-around items-center h-16 px-4">
            {mainItems.slice(0, 5).map(item => {
            const Icon = iconMap[item.key];
            const isActive = location.pathname === item.to;
            return <NavLink key={item.to} to={item.to} className={cn("flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </NavLink>;
          })}
          </div>
        </div>
      </div>
    </>;
};
export default Sidebar;