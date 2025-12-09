import { useMemo } from 'react';
import { Activity, Database, Cpu, AlertTriangle } from 'lucide-react';

// Layout
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';
import WidgetGroup from '@components/WidgetGroup';

const HealthStatusWidget = () => {
  const healthData = {
    cpu: 45,
    memory: 62,
    database: 78,
    api: 95,
  };

  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
        <h3 className="text-lg font-semibold mb-4">System Health</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                CPU Usage
              </span>
              <span className="text-sm font-semibold text-foreground">{healthData.cpu}%</span>
            </div>
            <div className="w-full bg-muted/30 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${healthData.cpu}%` }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Memory Usage
              </span>
              <span className="text-sm font-semibold text-foreground">{healthData.memory}%</span>
            </div>
            <div className="w-full bg-muted/30 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${healthData.memory}%` }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <Database className="w-4 h-4" />
                Database Usage
              </span>
              <span className="text-sm font-semibold text-foreground">{healthData.database}%</span>
            </div>
            <div className="w-full bg-muted/30 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${healthData.database}%` }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                API Uptime
              </span>
              <span className="text-sm font-semibold text-green-500">{healthData.api}%</span>
            </div>
            <div className="w-full bg-muted/30 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${healthData.api}%` }} />
            </div>
          </div>
        </div>
      </div>
    </WidgetGroup>
  );
};

const AlertsWidget = () => {
  const alerts = [
    { id: 1, title: 'High CPU Usage', severity: 'warning', time: '5 minutes ago' },
    { id: 2, title: 'Database Connection Slow', severity: 'info', time: '15 minutes ago' },
    { id: 3, title: 'API Response Time Elevated', severity: 'warning', time: '1 hour ago' },
  ];

  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div 
              key={alert.id}
              className={`p-3 rounded-lg border ${
                alert.severity === 'warning' 
                  ? 'border-yellow-500/20 bg-yellow-500/10' 
                  : 'border-blue-500/20 bg-blue-500/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`font-medium text-sm ${
                    alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                  }`}>
                    {alert.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetGroup>
  );
};

const MonitoringPageComponent = () => {
  const widgets = useMemo(() => ({
    health: <HealthStatusWidget />,
    alerts: <AlertsWidget />,
  }), []);

  return (
    <>
      <PageHeader 
        title="Monitoring" 
        metaDescription="System health, performance metrics, and alerts"
      />
      <AppGrid id="monitoring_page" widgets={widgets} />
    </>
  );
};

export default MonitoringPageComponent;
