import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Activity, Cpu, Database, Gauge, LayoutDashboard, ShieldCheck, Users, Workflow } from 'lucide-react';

// Layout
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';
import WidgetGroup from '@components/WidgetGroup';

// Services
import { supabase } from '@/integrations/supabase/client';

const fetchCount = async (table) => {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01') {
        return null;
      }
      throw error;
    }

    return count || 0;
  } catch {
    return null;
  }
};

const AdminCategoryCard = ({ card }) => {
  const Icon = card.icon;
  
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6 hover:shadow-lg transition cursor-pointer"
      onClick={() => window.location.href = card.href}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
          <p className="text-xs text-muted-foreground">{card.description}</p>
        </div>
        <Icon className="w-5 h-5 text-primary" />
      </div>
      {card.value !== null && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-2xl font-bold text-foreground">{card.value}</div>
          {card.pill && <span className="text-xs font-semibold text-primary mt-1">{card.pill}</span>}
        </div>
      )}
    </div>
  );
};

const AdminDashboardPage = () => {
  const counts = useQueries({
    queries: [
      {
        queryKey: ['admin', 'counts', 'users'],
        queryFn: () => fetchCount('user_profiles'),
        staleTime: 60000,
      },
      {
        queryKey: ['admin', 'counts', 'models'],
        queryFn: () => fetchCount('models'),
        staleTime: 60000,
      },
      {
        queryKey: ['admin', 'counts', 'matches'],
        queryFn: () => fetchCount('matches'),
        staleTime: 60000,
      },
    ],
  });

  const usersCount = counts[0]?.data || null;
  const modelsCount = counts[1]?.data || null;
  const matchesCount = counts[2]?.data || null;

  const cards = useMemo(() => [
    {
      id: 'dashboard-overview',
      title: 'System Overview',
      description: 'Health indicators across the platform',
      href: '/admin',
      icon: LayoutDashboard,
      value: 'Live',
      pill: 'Realtime',
    },
    {
      id: 'users',
      title: 'Users & Roles',
      description: 'Invite, promote and revoke access',
      href: '/admin/users',
      icon: Users,
      value: usersCount,
    },
    {
      id: 'jobs',
      title: 'Running Jobs',
      description: 'Manage automation lifecycle',
      href: '/admin/jobs',
      icon: Workflow,
      value: 3,
    },
    {
      id: 'models',
      title: 'AI & Predictions',
      description: 'Model activity and performance',
      href: '/models',
      icon: Activity,
      value: modelsCount,
    },
    {
      id: 'model-status',
      title: 'Model Control Center',
      description: 'ML model management & analytics',
      href: '/admin/model-status',
      icon: Gauge,
      value: 'Dashboard',
      pill: 'Live',
    },
    {
      id: 'database',
      title: 'Database & Content',
      description: 'Curate data sources and feeds',
      href: '/admin/database',
      icon: Database,
      value: matchesCount,
    },
    {
      id: 'security',
      title: 'System Security',
      description: 'Security, compliance, and auditing',
      href: '/admin/security',
      icon: ShieldCheck,
      value: 'Coming soon',
    },
  ], [usersCount, modelsCount, matchesCount]);

  const widgets = useMemo(() => ({
    cards: (
      <WidgetGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => (
            <AdminCategoryCard key={card.id} card={card} />
          ))}
        </div>
      </WidgetGroup>
    ),
  }), [cards]);

  return (
    <>
      <PageHeader 
        title="Admin Dashboard" 
        metaDescription="High-level overview of accounts, automations, and experimental systems"
      />
      <AppGrid id="admin_dashboard_page" widgets={widgets} />
    </>
  );
};

export default AdminDashboardPage;
