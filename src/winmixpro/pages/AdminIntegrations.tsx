import { useMemo } from "react";
import { Check, PlugZap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import WinmixProPage from "@/winmixpro/components/Page";
import { usePersistentState } from "@/winmixpro/hooks/usePersistentState";
import { winmixIntegrations } from "@/winmixpro/data";
const statusLabel: Record<string, string> = {
  configured: "Konfigurálva",
  partial: "Részleges",
  missing: "Hiányzik"
};
const statusBadge: Record<string, string> = {
  configured: "bg-emerald-500/10 text-emerald-200",
  partial: "bg-amber-500/10 text-amber-200",
  missing: "bg-rose-500/10 text-rose-200"
};
const AdminIntegrations = () => {
  const [verificationTimes, setVerificationTimes] = usePersistentState<Record<string, string>>("winmixpro-integrations-verified", {});
  const cards = useMemo(() => winmixIntegrations.map(integration => ({
    ...integration,
    verifiedAt: verificationTimes[integration.id]
  })), [verificationTimes]);
  const markVerified = (id: string) => {
    const time = new Date().toLocaleTimeString("hu-HU", {
      hour: "2-digit",
      minute: "2-digit"
    });
    setVerificationTimes(prev => ({
      ...prev,
      [id]: time
    }));
  };
  return <WinmixProPage title="Integrációs áttekintés" description="GitHub, Linear, Slack és Sentry mock státusz – validated timestamp helyben tárolva." actions={<Button variant="outline" size="sm" className="border-white/30 text-white" onClick={() => setVerificationTimes({})}>
          Reset ellenőrzés
        </Button>}>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map(integration => <div key={integration.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-white">{integration.name}</p>
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">{integration.owner}</p>
              </div>
              <Badge className={statusBadge[integration.status]}>
                {statusLabel[integration.status]}
              </Badge>
            </div>
            <p className="mt-3 text-sm text-white/70">{integration.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {integration.keys.map(key => <Badge key={key} variant="secondary" className="bg-black/40 text-white/80">
                  {key}
                </Badge>)}
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-white/60">
                Utolsó sync: {integration.lastSync}
                {integration.verifiedAt ? <p className="text-emerald-200">Ellenőrizve: {integration.verifiedAt}</p> : null}
              </div>
              <Button size="sm" variant="secondary" className="bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30" onClick={() => markVerified(integration.id)}>
                <Check className="mr-2 h-4 w-4" /> Ellenőrizve
              </Button>
            </div>
          </div>)}
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
        <div className="flex items-center gap-3 text-white">
          <PlugZap className="h-5 w-5" />
          <p className="font-semibold">Lokális állapot</p>
        </div>
        <p className="mt-2">
          Minden integrációs állapot a <code>src/winmixpro/data/index.ts</code> mock objektumaiból érkezik. A "Reset
          ellenőrzés" gomb törli a <code>winmixpro-integrations-verified</code> kulcsot a localStorage-ban.
        </p>
      </div>
    </WinmixProPage>;
};
export default AdminIntegrations;