import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import WinmixProPage from "@/winmixpro/components/Page";
import { usePersistentState } from "@/winmixpro/hooks/usePersistentState";
import { winmixPredictionAccuracy, winmixUpcomingPredictions } from "@/winmixpro/data";
const ranges = ["Utolsó 7 nap", "Utolsó 30 nap"] as const;
const AdminPredictions = () => {
  const [range, setRange] = usePersistentState<typeof ranges[number]>("winmixpro-prediction-range", ranges[0]);
  return <WinmixProPage title="Predikciók és pontosság" description="Modell- és crowd-pontosság, valamint piaci delta – teljesen mockolt idősorral." actions={<div className="flex flex-wrap gap-2">
          {ranges.map(item => <Button key={item} size="sm" variant={item === range ? "default" : "secondary"} className={item === range ? "bg-emerald-500 text-white" : "bg-black/40 text-white/70 hover:bg-black/30"} onClick={() => setRange(item)}>
              {item}
            </Button>)}
        </div>}>
      <div className="rounded-3xl border border-white/10 bg-black/50 p-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">Pontosság összevetés</p>
          <p className="text-lg font-semibold text-white">Modell vs crowd vs piac</p>
        </div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={winmixPredictionAccuracy}>
              <defs>
                <linearGradient id="modelGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="crowdGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={value => `${value}%`} />
              <Tooltip contentStyle={{
              background: "rgba(2,6,23,0.95)",
              borderRadius: 12
            }} />
              <Area type="monotone" dataKey="model" stroke="#34d399" fillOpacity={1} fill="url(#modelGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="crowd" stroke="#22d3ee" fillOpacity={1} fill="url(#crowdGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="market" stroke="#e2e8f0" fill="transparent" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">Következő mérkőzések</p>
        <div className="mt-4 grid gap-4">
          {winmixUpcomingPredictions.map(item => <div key={item.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-white text-lg font-semibold">{item.match}</p>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/40">{item.league}</p>
                </div>
                <Badge className="bg-white/10 text-white">{item.kickoff}</Badge>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase text-white/50">Model tipp</p>
                  <p className="text-sm text-white">{item.modelPick}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-white/50">Biztonság</p>
                  <p className="text-sm text-white">{item.confidence}%</p>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-emerald-400" style={{
                  width: `${item.confidence}%`
                }} />
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase text-white/50">Piac delta</p>
                  <p className={`text-sm font-semibold ${item.marketDelta >= 0 ? "text-emerald-200" : "text-rose-200"}`}>
                    {item.marketDelta >= 0 ? "+" : ""}
                    {item.marketDelta}%
                  </p>
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </WinmixProPage>;
};
export default AdminPredictions;