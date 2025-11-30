import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/navigation/Sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import CorrelationHeatmap from '@/components/crossleague/CorrelationHeatmap';
import LeagueComparisonRadarChart, { LeagueRadarMetric } from '@/components/crossleague/LeagueComparisonRadarChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Network, Radar, RefreshCcw, Copy } from 'lucide-react';
import { CopyButton, CopyBadge } from '@/components/common';
interface LeagueRow {
  id: string;
  name: string;
}
interface AnalyzeMetrics {
  goals: number;
  home_adv: number;
  balance: number;
  predictability: number;
  physicality: number;
}
interface AnalyzeResponse {
  leagues: LeagueRow[];
  metrics: Record<string, AnalyzeMetrics>;
  rankings?: Record<string, {
    league_id: string;
    score: number;
  }[]>;
  correlations?: Array<{
    league_a_id: string;
    league_b_id: string;
    coefficient: number;
  }>;
  insights?: string[];
}
interface HeatmapCorrelationRow {
  league_a_id: string;
  league_b_id: string;
  correlation_type: string;
  coefficient: number;
  sample_size: number;
}
interface HeatmapResponse {
  leagues: LeagueRow[];
  correlations: HeatmapCorrelationRow[];
}
interface MetaPatternRow {
  pattern_name: string;
  pattern_type: string;
  supporting_leagues: string[];
  evidence_strength: number;
  prediction_impact: number;
  pattern_description?: string | null;
}
interface MetaPatternsResponse {
  meta_patterns: MetaPatternRow[];
}
const CrossLeague = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const leaguesQuery = useQuery({
    queryKey: ['leagues-list'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('leagues').select('id, name');
      if (error) throw error;
      return (data ?? []) as LeagueRow[];
    }
  });
  useEffect(() => {
    if (leaguesQuery.data && leaguesQuery.data.length > 0 && selected.length === 0) {
      setSelected(leaguesQuery.data.slice(0, 2).map(l => l.id));
    }
  }, [leaguesQuery.data, selected.length]);
  const analyzeQuery = useQuery<AnalyzeResponse>({
    queryKey: ['cross-league-analyze', selected],
    enabled: selected.length > 0,
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.functions.invoke('cross-league-analyze', {
        body: {
          league_ids: selected,
          metrics: ['goals', 'home_adv', 'balance', 'predictability', 'physicality']
        }
      });
      if (error) throw error;
      return data as AnalyzeResponse;
    }
  });
  const heatmapQuery = useQuery<HeatmapResponse>({
    queryKey: ['correlations-heatmap'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.functions.invoke('cross-league-correlations', {
        body: {}
      });
      if (error) throw error;
      return data as HeatmapResponse;
    }
  });
  const metaPatternsQuery = useQuery<MetaPatternsResponse>({
    queryKey: ['meta-patterns-discover'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.functions.invoke('meta-patterns-discover', {
        body: {}
      });
      if (error) throw error;
      return data as MetaPatternsResponse;
    }
  });
  const radarData: LeagueRadarMetric[] = useMemo(() => {
    if (!analyzeQuery.data?.leagues || !analyzeQuery.data?.metrics) return [];
    return (analyzeQuery.data.leagues as LeagueRow[]).map((l: LeagueRow) => ({
      leagueId: l.id,
      leagueName: l.name,
      metrics: analyzeQuery.data.metrics[l.id] ?? {
        goals: 0,
        home_adv: 0,
        balance: 0,
        predictability: 0,
        physicality: 0
      }
    }));
  }, [analyzeQuery.data]);
  const heatmap = useMemo(() => {
    const leagues: LeagueRow[] = heatmapQuery.data?.leagues ?? [];
    const labels = leagues.map(l => l.name);
    const n = leagues.length;
    const matrix: number[][] = Array.from({
      length: n
    }, () => Array.from({
      length: n
    }, () => 0));
    const corrs: HeatmapCorrelationRow[] = heatmapQuery.data?.correlations ?? [];
    const mapKey = (a: string, b: string) => `${a}|${b}`;
    const corrMap = new Map<string, number>();
    for (const c of corrs) {
      if (c.correlation_type !== 'scoring_trend') continue;
      corrMap.set(mapKey(c.league_a_id, c.league_b_id), c.coefficient ?? 0);
      corrMap.set(mapKey(c.league_b_id, c.league_a_id), c.coefficient ?? 0);
    }
    leagues.forEach((a, i) => {
      leagues.forEach((b, j) => {
        if (i === j) {
          matrix[i][j] = 1;
          return;
        }
        const v = corrMap.get(mapKey(a.id, b.id));
        matrix[i][j] = typeof v === 'number' ? v : 0;
      });
    });
    return {
      labels,
      matrix
    };
  }, [heatmapQuery.data]);
  return <div className="min-h-screen">
      <Sidebar />
      <TopBar />
      <main className="ml-0 md:ml-[84px] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full ring-1 ring-primary/20 bg-primary/10 px-2.5 py-1 mb-2">
              <Network className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-primary font-semibold">
                Cross-League Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl tracking-tight text-foreground font-semibold">
              Liga-közi elemzés
            </h1>
            <p className="text-muted-foreground mt-1">
              Korrelációk, meta-patternök és liga-normalizált metrikák.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              Kiválasztott ligák:
            </div>
            <div className="flex flex-wrap gap-2">
              {(leaguesQuery.data ?? []).map(l => <Badge key={l.id} onClick={() => setSelected(prev => prev.includes(l.id) ? prev.filter(x => x !== l.id) : [...prev, l.id])} className={`${selected.includes(l.id) ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} cursor-pointer`}>
                  {l.name}
                </Badge>)}
            </div>
            <CopyButton text={selected.join(', ')} variant="outline" size="sm" successMessage="Selected leagues copied to clipboard">
              <Copy className="w-4 h-4 mr-2" />
              Copy Selection
            </CopyButton>
            <Button variant="ghost" size="sm" onClick={() => analyzeQuery.refetch()} className="ml-auto">
              <RefreshCcw className="w-4 h-4 mr-2" /> Frissítés
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radar className="w-4 h-4" /> LeagueComparisonRadarChart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LeagueComparisonRadarChart data={radarData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-4 h-4" /> CorrelationHeatmap
                  (scoring_trend)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CorrelationHeatmap labels={heatmap.labels ?? []} matrix={heatmap.matrix ?? []} />
                {heatmapQuery.data?.correlations && heatmapQuery.data.correlations.length > 0 && <div className="mt-4 flex justify-end">
                      <CopyButton text={JSON.stringify(heatmapQuery.data.correlations, null, 2)} size="sm" variant="outline" successMessage="Correlation data copied to clipboard">
                        <Copy className="w-4 h-4 mr-2" />
                        Export Correlations
                      </CopyButton>
                    </div>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-4 h-4" /> Meta-patternök
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(metaPatternsQuery.data?.meta_patterns ?? []).map((mp: MetaPatternRow) => <div key={`${mp.pattern_name}-${mp.pattern_type}`} className="p-4 rounded-lg ring-1 ring-border bg-card">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold">{mp.pattern_name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Típus: {mp.pattern_type} • Evidence:{' '}
                            {mp.evidence_strength}%
                          </div>
                          <div className="text-sm mt-2">
                            {mp.pattern_description}
                          </div>
                        </div>
                        <CopyButton text={`${mp.pattern_name}\nType: ${mp.pattern_type}\nEvidence: ${mp.evidence_strength}%\nDescription: ${mp.pattern_description || 'N/A'}`} size="sm" variant="ghost" successMessage="Meta pattern insight copied">
                          <Copy className="w-3 h-3" />
                        </CopyButton>
                      </div>
                    </div>)}
                {(!metaPatternsQuery.data?.meta_patterns || metaPatternsQuery.data.meta_patterns.length === 0) && <div className="text-sm text-muted-foreground">
                    Nincs elég adat meta-patternök azonosításához.
                  </div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>;
};
export default CrossLeague;