import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock8, RefreshCcw, Zap, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import WinmixProMetricCard from "@/winmixpro/components/MetricCard";
import WinmixProPage from "@/winmixpro/components/Page";
import { usePersistentState } from "@/winmixpro/hooks/usePersistentState";
import { winmixJobStats, winmixJobTimeline, winmixJobs } from "@/winmixpro/data";
const jobCategories: Array<{
  value: "mind" | "Import" | "Modellezés" | "Minőség" | "Piac";
  label: string;
}> = [{
  value: "mind",
  label: "Összes"
}, {
  value: "Import",
  label: "Import"
}, {
  value: "Modellezés",
  label: "Modellezés"
}, {
  value: "Minőség",
  label: "Minőség"
}, {
  value: "Piac",
  label: "Piac"
}];
const statusColors: Record<string, string> = {
  fut: "bg-emerald-500/10 text-emerald-200",
  sikeres: "bg-sky-500/10 text-sky-200",
  várakozik: "bg-amber-500/10 text-amber-200"
};
const timelineIcon = {
  siker: CheckCircle2,
  figyelmeztetes: AlertTriangle,
  hiba: XCircle
};
const AdminJobs = () => {
  const [category, setCategory] = usePersistentState<"mind" | "Import" | "Modellezés" | "Minőség" | "Piac">("winmixpro-job-filter", "mind");
  const [jobStates, setJobStates] = usePersistentState<Record<string, boolean>>("winmixpro-job-state", () => winmixJobs.reduce<Record<string, boolean>>((acc, job) => {
    acc[job.id] = job.status !== "várakozik";
    return acc;
  }, {}));
  const visibleJobs = useMemo(() => category === "mind" ? winmixJobs : winmixJobs.filter(job => job.category === category), [category]);
  return <WinmixProPage title="Automatizált folyamatok" description="Scheduler, job életciklus és SLA státuszok – minden adat mock forrásból érkezik a prototípushoz." actions={<Button size="sm" className="bg-emerald-500 text-white hover:bg-emerald-600">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Timeline frissítés
        </Button>}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <WinmixProMetricCard label="Futó jobok" value={`${winmixJobStats.running}`} hint="Utolsó 10 perc" trend="stabil" intent="positive" icon={Clock8} />
        <WinmixProMetricCard label="Automatizációs pont" value={`${winmixJobStats.automationScore}%`} hint="Service coverage" trend="+3% héten" intent="positive" icon={Zap} />
        <WinmixProMetricCard label="Átlagos futási idő" value={winmixJobStats.avgDuration} hint="Aggregált" trend="-26 mp" intent="neutral" />
      </div>

      <div className="rounded-3xl border border-white/15 bg-white/5 p-4 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {jobCategories.map(item => <Button key={item.value} size="sm" variant={category === item.value ? "default" : "secondary"} className={category === item.value ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-white/5 text-white/70 hover:bg-white/10"} onClick={() => setCategory(item.value)}>
              {item.label}
            </Button>)}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-white/10 bg-black/50 p-4">
          <div className="space-y-4">
            {visibleJobs.map(job => <div key={job.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/30">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{job.name}</p>
                    <p className="text-xs uppercase tracking-[0.4em] text-white/40">{job.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[job.status]}`}>
                      {job.status === "fut" ? "Fut" : job.status === "sikeres" ? "Sikeres" : "Várakozik"}
                    </span>
                    <label className="flex items-center gap-2 text-xs text-white/60">
                      <Switch checked={jobStates[job.id] ?? true} onCheckedChange={() => setJobStates(prev => ({
                    ...prev,
                    [job.id]: !(prev[job.id] ?? true)
                  }))} />
                      Engedélyezett
                    </label>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase text-white/50">Ütemezés</p>
                    <p className="text-sm text-white">{job.schedule}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-white/50">SLA</p>
                    <p className="text-sm text-white">{job.sla}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-white/50">Időtartam</p>
                    <p className="text-sm text-white">{job.duration}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-white/50">Haladás</p>
                    <div className="mt-1 h-2 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-emerald-400" style={{
                    width: `${job.progress}%`
                  }} />
                    </div>
                    <p className="text-xs text-white/60">{job.progress}%</p>
                  </div>
                </div>
              </div>)}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-black/60 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-white/60">Job idővonal</p>
          <ol className="mt-4 space-y-6 border-l border-white/20 pl-6">
            {winmixJobTimeline.map(entry => {
            const Icon = timelineIcon[entry.status];
            const intent = entry.status === "siker" ? "text-emerald-300" : entry.status === "figyelmeztetes" ? "text-amber-300" : "text-rose-300";
            return <li key={entry.id} className="relative">
                  <span className="absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-black">
                    <Icon className={`h-4 w-4 ${intent}`} />
                  </span>
                  <div className="rounded-2xl bg-black/40 p-3">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/40">{entry.time}</p>
                    <p className="text-sm font-semibold text-white">{entry.label}</p>
                    <p className="text-xs text-white/60">{entry.detail}</p>
                  </div>
                </li>;
          })}
          </ol>
        </div>
      </div>
    </WinmixProPage>;
};
export default AdminJobs;