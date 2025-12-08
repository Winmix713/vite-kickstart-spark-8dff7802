import { useMemo } from 'react';

// Layout
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';
import WidgetGroup from '@components/WidgetGroup';

const IntegrationsListWidget = () => {
  const integrations = [
    { id: 1, name: 'Supabase', status: 'connected', icon: '🔵' },
    { id: 2, name: 'Stripe', status: 'connected', icon: '💳' },
    { id: 3, name: 'SendGrid', status: 'configured', icon: '✉️' },
    { id: 4, name: 'Slack', status: 'pending', icon: '💬' },
    { id: 5, name: 'GitHub', status: 'connected', icon: '🐙' },
  ];

  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Integrations</h3>
        </div>

        <div className="divide-y divide-border">
          {integrations.map(integration => (
            <div key={integration.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <div className="font-medium text-foreground">{integration.name}</div>
                  <div className="text-xs text-muted-foreground">External Service</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  integration.status === 'connected' ? 'bg-green-500/20 text-green-500' :
                  integration.status === 'configured' ? 'bg-blue-500/20 text-blue-500' :
                  'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {integration.status}
                </span>
                <button className="px-3 py-1 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetGroup>
  );
};

const IntegrationsPageComponent = () => {
  const widgets = useMemo(() => ({
    integrations: <IntegrationsListWidget />,
  }), []);

  return (
    <>
      <PageHeader 
        title="Integrations" 
        metaDescription="Manage external service integrations"
      />
      <AppGrid id="integrations_page" widgets={widgets} />
    </>
  );
};

export default IntegrationsPageComponent;
