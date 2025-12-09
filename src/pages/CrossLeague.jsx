import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, Network, Radar, RefreshCcw } from 'lucide-react';

// Layout
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';
import WidgetGroup from '@components/WidgetGroup';

// Components
import CorrelationHeatmap from '@/components/crossleague/CorrelationHeatmap';
import LeagueComparisonRadarChart from '@/components/crossleague/LeagueComparisonRadarChart';

// Services
import { supabase } from '@/integrations/supabase/client';

const LeagueSelectWidget = ({ leagues, selected, onSelect, onRefresh }) => {
  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
        <h3 className="text-lg font-semibold mb-4">Select Leagues</h3>
        <div className="flex flex-wrap gap-2">
          {(leagues || []).map((league) => (
            <button
              key={league.id}
              onClick={() => onSelect(league.id)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                selected.includes(league.id)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {league.name}
            </button>
          ))}
        </div>
        <button 
          onClick={onRefresh}
          className="mt-4 px-3 py-1 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-2"
        >
          <RefreshCcw className="w-3 h-3" />
          Refresh Analysis
        </button>
      </div>
    </WidgetGroup>
  );
};

const RadarChartWidget = ({ data, loading }) => {
  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
        <div className="flex items-center gap-2 mb-4">
          <Radar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">League Comparison</h3>
        </div>
        {loading ? (
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            Loading radar data...
          </div>
        ) : (
          <LeagueComparisonRadarChart data={data} />
        )}
      </div>
    </WidgetGroup>
  );
};

const CorrelationWidget = ({ data, loading }) => {
  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
        <div className="flex items-center gap-2 mb-4">
          <Network className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Correlation Heatmap</h3>
        </div>
        {loading ? (
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            Loading heatmap data...
          </div>
        ) : (
          <CorrelationHeatmap labels={data.labels || []} matrix={data.matrix || []} />
        )}
      </div>
    </WidgetGroup>
  );
};

const MetaPatternsWidget = ({ patterns, loading }) => {
  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Meta Patterns</h3>
        </div>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Analyzing meta patterns...
          </div>
        ) : patterns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Insufficient data for meta pattern identification
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patterns.map((pattern) => (
              <div key={`${pattern.pattern_name}-${pattern.pattern_type}`} className="p-4 rounded-lg ring-1 ring-border bg-card/50">
                <div className="font-semibold text-foreground">{pattern.pattern_name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Type: {pattern.pattern_type} • Evidence: {Math.round(pattern.evidence_strength)}%
                </div>
                {pattern.pattern_description && (
                  <div className="text-sm mt-2 text-muted-foreground">{pattern.pattern_description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetGroup>
  );
};

const CrossLeaguePage = () => {
  const [selected, setSelected] = useState([]);

  const leaguesQuery = useQuery({
    queryKey: ['leagues-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leagues').select('id, name');
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (leaguesQuery.data && leaguesQuery.data.length > 0 && selected.length === 0) {
      setSelected(leaguesQuery.data.slice(0, 2).map((l) => l.id));
    }
  }, [leaguesQuery.data, selected.length]);

  const analyzeQuery = useQuery({
    queryKey: ['cross-league-analyze', selected],
    enabled: selected.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('cross-league-analyze', {
        body: { league_ids: selected, metrics: ['goals', 'home_adv', 'balance', 'predictability', 'physicality'] },
      });
      if (error) throw error;
      return data;
    },
  });

  const heatmapQuery = useQuery({
    queryKey: ['correlations-heatmap'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('cross-league-correlations', { body: {} });
      if (error) throw error;
      return data;
    },
  });

  const metaPatternsQuery = useQuery({
    queryKey: ['meta-patterns-discover'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('meta-patterns-discover', { body: {} });
      if (error) throw error;
      return data;
    },
  });

  const radarData = useMemo(() => {
    if (!analyzeQuery.data?.leagues || !analyzeQuery.data?.metrics) return [];
    return (analyzeQuery.data.leagues || []).map((league) => ({
      leagueId: league.id,
      leagueName: league.name,
      metrics: analyzeQuery.data.metrics[league.id] || { goals: 0, home_adv: 0, balance: 0, predictability: 0, physicality: 0 },
    }));
  }, [analyzeQuery.data]);

  const heatmap = useMemo(() => {
    const leagues = heatmapQuery.data?.leagues || [];
    const labels = leagues.map((l) => l.name);
    const n = leagues.length;
    const matrix = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));

    const corrs = heatmapQuery.data?.correlations || [];
    const mapKey = (a, b) => `${a}|${b}`;
    const corrMap = new Map();
    for (const c of corrs) {
      if (c.correlation_type !== 'scoring_trend') continue;
      corrMap.set(mapKey(c.league_a_id, c.league_b_id), c.coefficient || 0);
      corrMap.set(mapKey(c.league_b_id, c.league_a_id), c.coefficient || 0);
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
    return { labels, matrix };
  }, [heatmapQuery.data]);

  const handleSelectLeague = (leagueId) => {
    setSelected((prev) =>
      prev.includes(leagueId) ? prev.filter((x) => x !== leagueId) : [...prev, leagueId]
    );
  };

  const widgets = useMemo(() => ({
    select: <LeagueSelectWidget 
      leagues={leaguesQuery.data || []} 
      selected={selected} 
      onSelect={handleSelectLeague}
      onRefresh={() => analyzeQuery.refetch()}
    />,
    radar: <RadarChartWidget data={radarData} loading={analyzeQuery.isLoading} />,
    correlation: <CorrelationWidget data={heatmap} loading={heatmapQuery.isLoading} />,
    patterns: <MetaPatternsWidget patterns={metaPatternsQuery.data?.meta_patterns || []} loading={metaPatternsQuery.isLoading} />,
  }), [leaguesQuery.data, selected, radarData, analyzeQuery.isLoading, heatmap, heatmapQuery.isLoading, metaPatternsQuery.data, metaPatternsQuery.isLoading]);

  return (
    <>
      <PageHeader 
        title="Cross-League Intelligence" 
        metaDescription="Analyze correlations, meta-patterns, and league-normalized metrics"
      />
      <AppGrid id="cross_league_page" widgets={widgets} />
    </>
  );
};

export default CrossLeaguePage;
