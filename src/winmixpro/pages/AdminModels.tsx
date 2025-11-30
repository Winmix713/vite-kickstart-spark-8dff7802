import { Line, LineChart, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import WinmixProMetricCard from "@/winmixpro/components/MetricCard";
import WinmixProPage from "@/winmixpro/components/Page";
import { winmixModelSeries, winmixModels } from "@/winmixpro/data";
const typeLabels: Record<string, string> = {
  champion: "Champion",
  challenger: "Challenger",
  shadow: "Shadow"
};
const typeColors: Record<string, string> = {
  champion: "bg-emerald-500/10 text-emerald-200",
  challenger: "bg-sky-500/10 text-sky-200",
  shadow: "bg-white/10 text-white/70"
};
const AdminModels = () => <WinmixProPage title="Model vezérlő" description="Champion vs challenger teljesítmények, piaci összevetés és trafikelosztás – minden adat mock sorozatból töltve.">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <WinmixProMetricCard label="Champion pontosság" value="93.2%" hint="7 napos átlag" trend="+1.2%" intent="positive" />
      <WinmixProMetricCard label="Challenger difi" value="-3.3%" hint="Piaci baseline-hoz képest" trend="szűkült" intent="warning" />
      <WinmixProMetricCard label="Shadow logok" value="1 248" hint="Utolsó futás" trend="+184" />
    </div>

    <div className="rounded-3xl border border-white/10 bg-black/50 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">Pontosság trend</p>
          <p className="text-lg font-semibold text-white">Hét napos csúszó átlag</p>
        </div>
        <div className="flex gap-4 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <span className="h-2 w-8 rounded-full bg-emerald-400" /> Champion
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-8 rounded-full bg-sky-400" /> Challenger
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-8 rounded-full bg-white/60" /> Piac
          </div>
        </div>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={winmixModelSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
            <YAxis domain={[80, 95]} stroke="#94a3b8" fontSize={12} tickFormatter={value => `${value}%`} />
            <Tooltip contentStyle={{
            background: "rgba(2,6,23,0.95)",
            borderRadius: 12
          }} />
            <Line type="monotone" dataKey="champion" stroke="#34d399" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="challenger" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="market" stroke="#e2e8f0" strokeDasharray="5 5" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      {winmixModels.map(model => <div key={model.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-white">{model.name}</p>
              <p className="text-xs uppercase tracking-[0.45em] text-white/40">{model.league}</p>
            </div>
            <Badge className={typeColors[model.type]}>{typeLabels[model.type]}</Badge>
          </div>
          <div className="mt-4 grid gap-4 text-sm text-white/80 lg:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-white/50">Pontosság</p>
              <p className="text-xl font-semibold text-white">{model.accuracy.toFixed(1)}%</p>
              <p className="text-xs text-white/60">Trend: {model.trend >= 0 ? "+" : ""}{model.trend}%</p>
            </div>
            <div>
              <p className="text-xs uppercase text-white/50">Frissesség</p>
              <p className="text-xl font-semibold text-white">{model.freshness}</p>
              <p className="text-xs text-white/60">Traffic: {model.trafficShare}%</p>
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{
          width: `${model.trafficShare}%`
        }} />
          </div>
        </div>)}
    </div>
  </WinmixProPage>;
export default AdminModels;