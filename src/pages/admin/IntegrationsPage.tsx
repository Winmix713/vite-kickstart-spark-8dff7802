import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { captureExceptionSafe, isSentryEnabled } from "@/lib/sentry";
import { isCloudflareBeaconEnabled } from "@/lib/cloudflare";
import type { EnvironmentVariableSafe } from "@/types/admin";
import { Bug, Cloud, Code2, Database, FileText, GitBranch, Globe, MessageSquare, Rocket, Workflow } from "lucide-react";
interface IntegrationDef {
  id: string;
  name: string;
  description: string;
  type: "frontend" | "backend" | "hosting" | "observability";
  requiredKeys: string[]; // keys expected in environment_variables (server-side)
  frontendKeys?: string[]; // VITE_* keys
  icon: React.ComponentType<{
    className?: string;
  }>;
  docsUrl?: string;
}
const INTEGRATIONS: IntegrationDef[] = [{
  id: "github",
  name: "GitHub",
  description: "Repo links, webhooks, and CI triggers.",
  type: "backend",
  requiredKeys: ["GITHUB_TOKEN", "GITHUB_REPOSITORY"],
  icon: GitBranch,
  docsUrl: "https://docs.github.com/en/rest"
}, {
  id: "linear",
  name: "Linear",
  description: "Issue syncing and automation hooks.",
  type: "backend",
  requiredKeys: ["LINEAR_API_KEY", "LINEAR_TEAM_ID"],
  icon: Workflow,
  docsUrl: "https://developers.linear.app/docs/graphql/overview"
}, {
  id: "slack",
  name: "Slack",
  description: "Alerting and release notifications.",
  type: "backend",
  requiredKeys: ["SLACK_WEBHOOK_URL"],
  icon: MessageSquare,
  docsUrl: "https://api.slack.com/messaging/webhooks"
}, {
  id: "cloudflare",
  name: "Cloudflare Observability",
  description: "Browser Insights beacon for RUM.",
  type: "observability",
  requiredKeys: [],
  frontendKeys: ["VITE_CLOUDFLARE_BEACON_TOKEN"],
  icon: Cloud,
  docsUrl: "https://developers.cloudflare.com/analytics/browser-insights/"
}, {
  id: "neon",
  name: "Neon Postgres",
  description: "Serverless Postgres for backend services.",
  type: "backend",
  requiredKeys: ["NEON_DATABASE_URL"],
  icon: Database,
  docsUrl: "https://neon.tech/docs"
}, {
  id: "notion",
  name: "Notion",
  description: "Knowledge base and content sync.",
  type: "backend",
  requiredKeys: ["NOTION_API_KEY"],
  icon: FileText,
  docsUrl: "https://developers.notion.com/reference/intro"
}, {
  id: "prisma",
  name: "Prisma",
  description: "ORM for Node/Edge backends (server-only).",
  type: "backend",
  requiredKeys: ["DATABASE_URL"],
  icon: Code2,
  docsUrl: "https://www.prisma.io/docs"
}, {
  id: "render",
  name: "Render",
  description: "Hosting for servers, CRON and workers.",
  type: "hosting",
  requiredKeys: ["RENDER_DEPLOY_HOOK_URL"],
  icon: Rocket,
  docsUrl: "https://render.com/docs/deploy-hooks"
}, {
  id: "sentry",
  name: "Sentry",
  description: "Front-end error tracking.",
  type: "observability",
  requiredKeys: [],
  frontendKeys: ["VITE_SENTRY_DSN", "VITE_SENTRY_ENV"],
  icon: Bug,
  docsUrl: "https://docs.sentry.io/platforms/javascript/"
}, {
  id: "webflow",
  name: "Webflow",
  description: "Marketing site CMS sync and forms.",
  type: "backend",
  requiredKeys: ["WEBFLOW_API_TOKEN", "WEBFLOW_SITE_ID"],
  icon: Globe,
  docsUrl: "https://developers.webflow.com/reference"
}];
const fetchEnvSafe = async (): Promise<EnvironmentVariableSafe[]> => {
  const {
    data,
    error
  } = await supabase.from("environment_variables_safe").select("id,key,value,is_secret,category,created_at,updated_at,created_by");
  if (error) throw new Error(error.message);
  return data ?? [];
};
function useEnvSafe() {
  return useQuery({
    queryKey: ["environment-variables-safe"],
    queryFn: fetchEnvSafe,
    staleTime: 30_000
  });
}
function IntegrationStatusBadge({
  status
}: {
  status: "configured" | "partial" | "missing";
}) {
  const map = {
    configured: {
      label: "Configured",
      class: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
    },
    partial: {
      label: "Partial",
      class: "bg-amber-500/15 text-amber-500 border-amber-500/30"
    },
    missing: {
      label: "Not Configured",
      class: "bg-rose-500/15 text-rose-500 border-rose-500/30"
    }
  } as const;
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium border", map[status].class)}>
      {map[status].label}
    </span>;
}
export default function IntegrationsPage() {
  const env = useEnvSafe();
  const statuses = useMemo(() => {
    const vars = env.data ?? [];
    return INTEGRATIONS.map(i => {
      if (i.id === "sentry") {
        const enabled = isSentryEnabled();
        return {
          def: i,
          status: enabled ? "configured" : "missing" as const
        };
      }
      if (i.id === "cloudflare") {
        const enabled = isCloudflareBeaconEnabled();
        return {
          def: i,
          status: enabled ? "configured" : "missing" as const
        };
      }
      const required = i.requiredKeys.length;
      const present = i.requiredKeys.filter(k => vars.some(v => v.key === k)).length;
      const status: "configured" | "partial" | "missing" = present === 0 ? "missing" : present < required ? "partial" : "configured";
      return {
        def: i,
        status
      };
    });
  }, [env.data]);
  return <AdminLayout title="Integrations" description="Configure and verify connections with your tools and platforms." breadcrumbs={[{
    label: "Admin",
    href: "/admin"
  }, {
    label: "Integrations"
  }]} actions={null}>
      <Alert className="bg-muted/30 border-border/60">
        <AlertDescription>
          Secrets are stored server-side in the Environment Variables table. Avoid putting secrets in VITE_* variables.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statuses.map(({
        def,
        status
      }) => <Card key={def.id} className="border-border/60 bg-muted/20">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <def.icon className="w-5 h-5" />
                <div>
                  <CardTitle className="text-lg font-semibold">{def.name}</CardTitle>
                  <CardDescription>{def.description}</CardDescription>
                </div>
              </div>
              <IntegrationStatusBadge status={status} />
            </CardHeader>
            <CardContent className="space-y-4">
              {def.requiredKeys.length > 0 ? <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Required server keys</div>
                  <div className="flex flex-wrap gap-2">
                    {def.requiredKeys.map(k => {
                const has = (env.data ?? []).some(v => v.key === k);
                return <Badge key={k} variant={has ? "default" : "secondary"} className={cn(!has && "opacity-70")}>{k}</Badge>;
              })}
                  </div>
                </div> : null}

              {def.frontendKeys && def.frontendKeys.length > 0 ? <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Frontend keys</div>
                  <div className="flex flex-wrap gap-2">
                    {def.frontendKeys.map(k => {
                const envMap = import.meta.env as unknown as Record<string, unknown>;
                const has = Boolean(envMap[k]);
                return <Badge key={k} variant={has ? "default" : "secondary"} className={cn(!has && "opacity-70")}>{k}</Badge>;
              })}
                  </div>
                </div> : null}

              <div className="flex flex-wrap gap-2">
                {def.docsUrl ? <Button asChild variant="outline" size="sm">
                    <a href={def.docsUrl} target="_blank" rel="noreferrer">Docs</a>
                  </Button> : null}
                {def.id === "sentry" ? <Button variant="outline" size="sm" onClick={() => {
              try {
                throw new Error("Sentry test error");
              } catch (e) {
                captureExceptionSafe(e as Error, {
                  test: true
                });
              }
            }} disabled={!isSentryEnabled()}>
                    Send test error
                  </Button> : null}
              </div>

              {def.id === "prisma" || def.id === "neon" || def.id === "render" ? <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-600">
                  <AlertDescription>
                    This project runs a frontend SPA with Supabase Edge Functions. Prisma/Neon/Render are for backend services
                    only. Store credentials in the Environment Variables table and use them in Edge Functions or external servers.
                  </AlertDescription>
                </Alert> : null}
            </CardContent>
          </Card>)}
      </div>

      <Card className="border-border/60 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Recommended environment variables</CardTitle>
          <CardDescription>Add the following keys to the Environment Variables table for a complete setup.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li>GITHUB_TOKEN, GITHUB_REPOSITORY</li>
            <li>LINEAR_API_KEY, LINEAR_TEAM_ID</li>
            <li>SLACK_WEBHOOK_URL</li>
            <li>NOTION_API_KEY</li>
            <li>WEBFLOW_API_TOKEN, WEBFLOW_SITE_ID</li>
            <li>NEON_DATABASE_URL or DATABASE_URL (for Prisma)</li>
            <li>RENDER_DEPLOY_HOOK_URL</li>
            <li>VITE_SENTRY_DSN, VITE_SENTRY_ENV (frontend only)</li>
            <li>VITE_CLOUDFLARE_BEACON_TOKEN (frontend only)</li>
          </ul>
        </CardContent>
      </Card>
    </AdminLayout>;
}