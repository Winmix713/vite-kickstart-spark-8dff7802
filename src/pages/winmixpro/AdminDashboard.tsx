import { useMemo, useEffect, useState } from "react";
import { Activity, Zap, Shield, Gauge, BarChart3, Clock } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
interface StatTile {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  trend?: string;
}
interface ActivityItem {
  id: string;
  action: string;
  timestamp: string;
  user: string;
  status: "success" | "error" | "pending";
}
const StatTile = ({
  label,
  value,
  icon,
  gradient,
  trend
}: StatTile) => <Card className="p-6 glass-card-hover group overflow-hidden relative">
    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity {gradient}" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={cn("p-2 rounded-lg", gradient, "bg-opacity-10")}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold">{value}</h3>
        {trend && <span className={cn("text-xs font-medium", trend.includes("+") ? "text-green-400" : "text-red-400")}>
            {trend}
          </span>}
      </div>
    </div>
  </Card>;
const ActivityLog = ({
  items
}: {
  items: ActivityItem[];
}) => <Card className="glass-card p-6">
    <h2 className="text-lg font-semibold mb-4">Tevékenységi napló</h2>
    <div className="space-y-3">
      {items.map(item => <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
          <div className="flex-1">
            <p className="text-sm font-medium">{item.action}</p>
            <p className="text-xs text-muted-foreground">{item.user}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{item.timestamp}</span>
            <div className={cn("w-2 h-2 rounded-full", item.status === "success" && "bg-green-500", item.status === "error" && "bg-red-500", item.status === "pending" && "bg-yellow-500")} />
          </div>
        </div>)}
    </div>
  </Card>;
const SystemStatusCard = ({
  title,
  statuses
}: {
  title: string;
  statuses: Array<{
    name: string;
    status: "online" | "offline" | "warning";
  }>;
}) => <Card className="glass-card p-6">
    <h2 className="text-lg font-semibold mb-4">{title}</h2>
    <div className="space-y-3">
      {statuses.map((s, idx) => <div key={idx} className="flex items-center justify-between p-2">
          <span className="text-sm">{s.name}</span>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", s.status === "online" && "bg-green-500", s.status === "offline" && "bg-red-500", s.status === "warning" && "bg-yellow-500")} />
            <span className="text-xs text-muted-foreground capitalize">{s.status}</span>
          </div>
        </div>)}
    </div>
  </Card>;
const WinmixProAdminDashboard = () => {
  const [stats, setStats] = useState<StatTile[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [systemStatus, setSystemStatus] = useState<Array<{
    name: string;
    status: "online" | "offline" | "warning";
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Simulate loading from localStorage/mock data
    const loadMockData = () => {
      setTimeout(() => {
        setStats([{
          label: "Aktív felhasználók",
          value: 1247,
          icon: <Activity className="w-5 h-5" />,
          gradient: "from-emerald-500 to-emerald-600",
          trend: "+12%"
        }, {
          label: "Rendszer teljesítménye",
          value: "98.5%",
          icon: <Gauge className="w-5 h-5" />,
          gradient: "from-blue-500 to-blue-600",
          trend: "+2.3%"
        }, {
          label: "API felkérések",
          value: "2.4M",
          icon: <Zap className="w-5 h-5" />,
          gradient: "from-amber-500 to-amber-600",
          trend: "+8.2%"
        }, {
          label: "Biztonsági szint",
          value: "Magas",
          icon: <Shield className="w-5 h-5" />,
          gradient: "from-purple-500 to-purple-600",
          trend: "+0.5%"
        }, {
          label: "Adat feldolgozás",
          value: "1.2GB",
          icon: <BarChart3 className="w-5 h-5" />,
          gradient: "from-pink-500 to-pink-600",
          trend: "+15%"
        }, {
          label: "Válaszidő",
          value: "125ms",
          icon: <Clock className="w-5 h-5" />,
          gradient: "from-cyan-500 to-cyan-600",
          trend: "-5%"
        }]);
        setActivityItems([{
          id: "1",
          action: "Rendszer frissítés",
          timestamp: "2 perc",
          user: "admin",
          status: "success"
        }, {
          id: "2",
          action: "Adatbázis biztonsági mentés",
          timestamp: "15 perc",
          user: "system",
          status: "success"
        }, {
          id: "3",
          action: "Telemetria szinkronizálás",
          timestamp: "32 perc",
          user: "analytics",
          status: "pending"
        }, {
          id: "4",
          action: "Felhasználói bejelentkezés",
          timestamp: "45 perc",
          user: "user123",
          status: "success"
        }, {
          id: "5",
          action: "API kulcs regenerálása",
          timestamp: "1 óra",
          user: "admin",
          status: "success"
        }]);
        setSystemStatus([{
          name: "Adatbázis szerver",
          status: "online"
        }, {
          name: "API szerver",
          status: "online"
        }, {
          name: "Cache rendszer",
          status: "online"
        }, {
          name: "Naplózás szolgáltatás",
          status: "warning"
        }, {
          name: "Biztonsági modul",
          status: "online"
        }]);
        setIsLoading(false);
      }, 500);
    };
    loadMockData();
  }, []);
  if (isLoading) {
    return <AdminLayout title="WinmixPro Admin" description="Rendszerkezelés és teljesítmény monitorozás" breadcrumbs={[{
      label: "WinmixPro",
      href: "/winmixpro/admin"
    }, {
      label: "Irányítópult"
    }]}>
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-lg" />)}
          </div>
        </div>
      </AdminLayout>;
  }
  return <AdminLayout title="WinmixPro Admin" description="Rendszerkezelés és teljesítmény monitorozás" breadcrumbs={[{
    label: "WinmixPro",
    href: "/winmixpro/admin"
  }, {
    label: "Irányítópult"
  }]}>
      {/* Stats Grid - 6 tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 animate-fade-in">
        {stats.map((stat, idx) => <div key={idx} className="animate-fade-in" style={{
        animationDelay: `${idx * 50}ms`
      }}>
            <StatTile {...stat} />
          </div>)}
      </div>

      {/* Bottom Section - 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" style={{
      animationDelay: "300ms"
    }}>
        {/* Activity Log */}
        <div className="lg:col-span-2">
          <ActivityLog items={activityItems} />
        </div>

        {/* System Status */}
        <div>
          <SystemStatusCard title="Rendszer státusza" statuses={systemStatus} />
        </div>
      </div>
    </AdminLayout>;
};
export default WinmixProAdminDashboard;