import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Alert, AlertDescription } from "@/components/ui/alert";
interface Match {
  id: string;
  league_id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  halftime_home_score: number | null;
  halftime_away_score: number | null;
  home_team?: {
    id: string;
    name: string;
  };
  away_team?: {
    id: string;
    name: string;
  };
}
interface Team {
  id: string;
  name: string;
}
const fetchMatches = async (): Promise<Match[]> => {
  const {
    data,
    error
  } = await supabase.from("matches").select(`
      *,
      home_team:teams!matches_home_team_id_fkey(id, name),
      away_team:teams!matches_away_team_id_fkey(id, name)
    `).order("match_date", {
    ascending: true
  });
  if (error) throw new Error(error.message);
  return data as unknown as Match[] || [];
};
const fetchTeams = async (): Promise<Team[]> => {
  const {
    data,
    error
  } = await supabase.from("teams").select("id, name").order("name", {
    ascending: true
  });
  if (error) throw new Error(error.message);
  return data || [];
};
function isCompleted(match: Match) {
  const status = (match.status || "").toLowerCase();
  return status === "completed" || status === "finished";
}
export default function StatsPage() {
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [location, setLocation] = useState<"all" | "home" | "away">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const matchesQuery = useQuery({
    queryKey: ["stats", "matches"],
    queryFn: fetchMatches
  });
  const teamsQuery = useQuery({
    queryKey: ["stats", "teams"],
    queryFn: fetchTeams
  });
  const filtered = useMemo(() => {
    const all = (matchesQuery.data || []) as Match[];
    const byTeam = all.filter(m => {
      if (selectedTeam === "all") return true;
      if (location === "home") return m.home_team_id === selectedTeam;
      if (location === "away") return m.away_team_id === selectedTeam;
      return m.home_team_id === selectedTeam || m.away_team_id === selectedTeam;
    });
    const byDate = byTeam.filter(m => {
      const d = new Date(m.match_date).getTime();
      if (Number.isNaN(d)) return false;
      const afterFrom = dateFrom ? d >= new Date(dateFrom).getTime() : true;
      const beforeTo = dateTo ? d <= new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : true;
      return afterFrom && beforeTo;
    });
    return byDate;
  }, [matchesQuery.data, selectedTeam, location, dateFrom, dateTo]);
  const completed = useMemo(() => filtered.filter(m => isCompleted(m) && m.home_score !== null && m.away_score !== null), [filtered]);
  const outcomeDist = useMemo(() => {
    let home = 0,
      draw = 0,
      away = 0;
    for (const m of completed) {
      if ((m.home_score ?? 0) > (m.away_score ?? 0)) home++;else if ((m.home_score ?? 0) < (m.away_score ?? 0)) away++;else draw++;
    }
    const total = completed.length || 1;
    return [{
      name: "Home",
      value: Math.round(home / total * 100)
    }, {
      name: "Draw",
      value: Math.round(draw / total * 100)
    }, {
      name: "Away",
      value: Math.round(away / total * 100)
    }];
  }, [completed]);
  const avgGoals = useMemo(() => {
    if (completed.length === 0) return 0;
    const sum = completed.reduce((acc, m) => acc + (m.home_score ?? 0) + (m.away_score ?? 0), 0);
    return Number((sum / completed.length).toFixed(2));
  }, [completed]);
  const goalHistogram = useMemo(() => {
    const bins = {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
      "4+": 0
    } as Record<string, number>;
    for (const m of completed) {
      const total = (m.home_score ?? 0) + (m.away_score ?? 0);
      if (total <= 3) bins[String(total)]++;else bins["4+"]++;
    }
    return Object.entries(bins).map(([k, v]) => ({
      goals: k,
      count: v
    }));
  }, [completed]);
  const scorelineTop = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of completed) {
      const key = `${m.home_score}-${m.away_score}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries()).map(([score, count]) => ({
      score,
      count
    })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [completed]);
  const dataIssues = useMemo(() => {
    const issues: Array<{
      match: Match;
      issue: string;
    }> = [];
    for (const m of filtered) {
      const dateOk = !Number.isNaN(new Date(m.match_date).getTime());
      if (!dateOk) {
        issues.push({
          match: m,
          issue: "Invalid date"
        });
      }
      const hs = m.home_score;
      const as = m.away_score;
      if (isCompleted(m) && (hs === null || as === null)) {
        issues.push({
          match: m,
          issue: "Completed but missing score"
        });
      }
      if ((hs ?? 0) < 0 || (as ?? 0) < 0) {
        issues.push({
          match: m,
          issue: "Negative score"
        });
      }
      if (m.halftime_home_score !== null && hs !== null && m.halftime_home_score > hs) {
        issues.push({
          match: m,
          issue: "Halftime home score > final"
        });
      }
      if (m.halftime_away_score !== null && as !== null && m.halftime_away_score > as) {
        issues.push({
          match: m,
          issue: "Halftime away score > final"
        });
      }
      if ((hs ?? 0) + (as ?? 0) > 20) {
        issues.push({
          match: m,
          issue: "Unusually high total goals"
        });
      }
      if (m.home_team_id === m.away_team_id) {
        issues.push({
          match: m,
          issue: "Same team for home and away"
        });
      }
    }
    return issues;
  }, [filtered]);
  return <AdminLayout title="Stats & Data Quality" description="Alap eloszlások, scoreline gyakoriságok, adatminőség ellenőrzések" breadcrumbs={[{
    label: "Admin",
    href: "/admin"
  }, {
    label: "Stats & Data Quality"
  }]}>
      <Card className="bg-card/60 border-border/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Szűrők</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Csapat</label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Összes csapat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Összes</SelectItem>
                  {teamsQuery.data?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Helyszín</label>
              <Select value={location} onValueChange={v => setLocation(v as "all" | "home" | "away")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Összes</SelectItem>
                  <SelectItem value="home">Hazai</SelectItem>
                  <SelectItem value="away">Vendég</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Dátumtól</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Dátumig</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/60 border-border/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Elemzett mérkőzések</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completed.length}</div>
            <p className="text-muted-foreground text-xs mt-1">Csak befejezett, pontszámmal rendelkező meccsek</p>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Átlagos gólok</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgGoals}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Eredmény eloszlás</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {outcomeDist.map(o => <Badge key={o.name} variant="secondary">{o.name}: {o.value}%</Badge>)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/60 border-border/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Gólszám hisztogram</CardTitle>
          </CardHeader>
          <CardContent>
            {completed.length === 0 ? <Alert>
                <AlertDescription>Nincs elegendő adat a megjelenítéshez.</AlertDescription>
              </Alert> : <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={goalHistogram} margin={{
                top: 20,
                right: 20,
                left: 0,
                bottom: 20
              }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 17%)" />
                    <XAxis dataKey="goals" tick={{
                  fill: "hsl(215, 20%, 65%)"
                }} />
                    <YAxis allowDecimals={false} tick={{
                  fill: "hsl(215, 20%, 65%)"
                }} />
                    <Tooltip contentStyle={{
                  backgroundColor: "hsl(11, 11%, 8%)",
                  border: "1px solid hsl(215, 20%, 17%)",
                  color: "hsl(210, 40%, 98%)"
                }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {goalHistogram.map((entry, index) => <Cell key={`cell-${index}`} fill="hsl(160, 84%, 39%)" />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>}
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Top pontos eredmények</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Eredmény</TableHead>
                  <TableHead>Gyakoriság</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scorelineTop.map(row => <TableRow key={row.score}>
                    <TableCell className="font-mono">{row.score}</TableCell>
                    <TableCell>{row.count}</TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/60 border-border/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Adatminőség - problémás rekordok</CardTitle>
        </CardHeader>
        <CardContent>
          {dataIssues.length === 0 ? <div className="text-muted-foreground">Nincs problémás rekord a szűrők alapján.</div> : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dátum</TableHead>
                  <TableHead>Mérkőzés</TableHead>
                  <TableHead>Probléma</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataIssues.map(({
              match,
              issue
            }) => <TableRow key={`${match.id}-${issue}`}>
                    <TableCell className="font-mono text-sm">{new Date(match.match_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {match.home_team?.name || match.home_team_id} vs {match.away_team?.name || match.away_team_id}
                    </TableCell>
                    <TableCell className="text-red-400">{issue}</TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>
    </AdminLayout>;
}