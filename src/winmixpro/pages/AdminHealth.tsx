import WinmixProMetricCard from "@/winmixpro/components/MetricCard";
import WinmixProPage from "@/winmixpro/components/Page";
import { winmixHealthAlerts, winmixHealthMatrix, winmixHealthMetricKeys } from "@/winmixpro/data";
const levelClasses: Record<string, string> = {
  ok: "bg-emerald-500/10 text-emerald-200",
  warning: "bg-amber-500/10 text-amber-200",
  critical: "bg-rose-500/10 text-rose-200"
};
const AdminHealth = () => <WinmixProPage title="Rendszer egészség" description="Heatmap, riasztások és szolgáltatás szintű mutatók (minden adat lokális mintából).">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <WinmixProMetricCard label="SLA tartás" value="98.4%" hint="Rolling 30 nap" trend="+0.6%" intent="positive" />
      <WinmixProMetricCard label="Aktív riasztások" value={`${winmixHealthAlerts.length}`} hint="Ebből kritikus: 1" trend="-2 ma" intent="neutral" />
      <WinmixProMetricCard label="Átlagos latency" value="206 ms" hint="Backend szolgáltatások" trend="+12 ms" intent="warning" />
    </div>

    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-black/40">
      <table className="w-full min-w-[640px] text-left text-sm text-white/70">
        <thead>
          <tr>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-white/40">Szolgáltatás</th>
            {winmixHealthMetricKeys.map(metric => <th key={metric.key} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
                {metric.label}
              </th>)}
          </tr>
        </thead>
        <tbody>
          {winmixHealthMatrix.map(row => <tr key={row.service} className="border-t border-white/5">
              <td className="px-4 py-4 font-semibold text-white">{row.service}</td>
              {winmixHealthMetricKeys.map(metric => {
            const cell = row.metrics[metric.key];
            return <td key={`${row.service}-${metric.key}`} className="px-4 py-4">
                    <div className={`rounded-2xl px-3 py-3 text-center text-sm font-semibold ${levelClasses[cell.level]}`}>
                      <p>{cell.value}</p>
                    </div>
                  </td>;
          })}
            </tr>)}
        </tbody>
      </table>
    </div>

    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.4em] text-white/40">Riasztások</p>
      <div className="mt-3 space-y-3">
        {winmixHealthAlerts.map(alert => <div key={alert.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{alert.title}</p>
                <p className="text-xs text-white/60">{alert.description}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${alert.severity === "critical" ? "bg-rose-500/10 text-rose-200" : alert.severity === "warning" ? "bg-amber-500/10 text-amber-200" : "bg-white/10 text-white"}`}>
                {alert.severity}
              </span>
            </div>
            <p className="mt-2 text-xs text-white/60">{alert.timestamp}</p>
          </div>)}
        {winmixHealthAlerts.length === 0 ? <p className="text-sm text-white/60">Nincs aktív riasztás.</p> : null}
      </div>
    </div>
  </WinmixProPage>;
export default AdminHealth;