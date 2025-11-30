import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WinmixProPage from "@/winmixpro/components/Page";
import { usePersistentState } from "@/winmixpro/hooks/usePersistentState";
import { winmixGoalDistributions, winmixQualityFlags, winmixScorelineLeaders, winmixStatLeagues, winmixStatRanges, type WinmixLeague } from "@/winmixpro/data";
const AdminStats = () => {
  const [league, setLeague] = usePersistentState<WinmixLeague>("winmixpro-stats-league", winmixStatLeagues[0]);
  const [range, setRange] = usePersistentState<(typeof winmixStatRanges)[number]>("winmixpro-stats-range", winmixStatRanges[0]);
  const goalData = winmixGoalDistributions[league];
  const scorelines = winmixScorelineLeaders[league];
  const issues = winmixQualityFlags.filter(flag => flag.league === league);
  return <WinmixProPage title="Adatstatisztikák" description="Gól eloszlások, scoreline trendek és minőségi zászlók – mind lokalizált mintából." actions={<div className="flex flex-wrap gap-2">
          <Select value={league} onValueChange={value => setLeague(value as WinmixLeague)}>
            <SelectTrigger className="w-[180px] border-white/30 bg-black/40 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-white">
              {winmixStatLeagues.map(item => <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={value => setRange(value as (typeof winmixStatRanges)[number])}>
            <SelectTrigger className="w-[180px] border-white/30 bg-black/40 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-white">
              {winmixStatRanges.map(item => <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>}>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-white/10 bg-black/50 p-4">
          <p className="text-sm font-semibold text-white">Gól eloszlás – {league}</p>
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">{range}</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={goalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{
                background: "rgba(2,6,23,0.95)",
                borderRadius: 12
              }} />
                <Bar dataKey="matches" fill="#34d399" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">Top scoreline</p>
          <div className="mt-4 space-y-3">
            {scorelines.map(scoreline => <div key={scoreline.scoreline} className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <div className="flex items-center justify-between text-white">
                  <p className="text-lg font-semibold">{scoreline.scoreline}</p>
                  <Badge className="bg-white/10 text-white">{scoreline.count}x</Badge>
                </div>
                <p className="text-xs text-white/60">
                  Trend: {scoreline.trend >= 0 ? "+" : ""}
                  {scoreline.trend}
                </p>
              </div>)}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
        <p className="text-sm font-semibold text-white">Adatminőség</p>
        <div className="mt-3 space-y-3">
          {issues.length === 0 ? <p className="text-sm text-white/60">Nincs nyitott zászló ehhez a ligához.</p> : issues.map(issue => <div key={issue.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Badge className={issue.severity === "high" ? "bg-rose-500/10 text-rose-200" : "bg-amber-500/10 text-amber-200"}>
                    {issue.severity === "high" ? "Kritikus" : "Közepes"}
                  </Badge>
                  <p className="text-white/80">{issue.description}</p>
                </div>
              </div>)}
        </div>
      </div>
    </WinmixProPage>;
};
export default AdminStats;