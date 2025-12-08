import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// Layout
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';
import WidgetGroup from '@components/WidgetGroup';

// Services
import { supabase } from '@/integrations/supabase/client';

const DashboardStatsWidget = ({ stats }) => {
  return (
    <WidgetGroup>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Total Predictions</div>
          <div className="text-3xl font-bold text-foreground">{stats.totalPredictions}</div>
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Overall Accuracy</div>
          <div className="text-3xl font-bold text-green-500">{stats.accuracy}%</div>
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Top Pattern</div>
          <div className="text-lg font-semibold text-foreground truncate">{stats.topPattern}</div>
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Winning Streak</div>
          <div className="text-3xl font-bold text-blue-500">{stats.winningStreak}</div>
        </div>
      </div>
    </WidgetGroup>
  );
};

const RecentPredictionsWidget = ({ predictions }) => {
  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Predictions</h3>
        {predictions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No predictions yet</div>
        ) : (
          <div className="space-y-3">
            {predictions.map((pred) => (
              <div key={pred.id} className="border border-border/60 rounded-lg p-4 bg-muted/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-sm">
                    {pred.match.home_team} vs {pred.match.away_team}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    pred.was_correct === true ? 'bg-green-500/20 text-green-500' :
                    pred.was_correct === false ? 'bg-red-500/20 text-red-500' :
                    'bg-gray-500/20 text-gray-500'
                  }`}>
                    {pred.was_correct === true ? '✓ Correct' :
                     pred.was_correct === false ? '✗ Wrong' :
                     'Pending'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {pred.match.league} • {new Date(pred.match.match_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground">Prediction:</span>
                    <span className="ml-2 text-sm font-medium text-foreground">{pred.predicted_outcome}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground">Confidence:</span>
                    <span className="ml-2 text-sm font-medium text-primary">{Math.round(pred.confidence_score)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetGroup>
  );
};

const PatternPerformanceWidget = ({ patterns }) => {
  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
        <h3 className="text-lg font-semibold mb-4">Pattern Performance</h3>
        {patterns.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No pattern data available</div>
        ) : (
          <div className="space-y-3">
            {patterns.slice(0, 5).map((pattern, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-1">{pattern.name}</div>
                  <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${pattern.accuracy}%` }}
                    />
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-semibold text-sm text-foreground">{Math.round(pattern.accuracy)}%</div>
                  <div className="text-xs text-muted-foreground">{pattern.total} predictions</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetGroup>
  );
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [stats, setStats] = useState({
    totalPredictions: 0,
    accuracy: 0,
    topPattern: 'N/A',
    winningStreak: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const { data: predictionsData, error: predictionsError } = await supabase
        .from('predictions')
        .select(`
          id,
          predicted_outcome,
          confidence_score,
          actual_outcome,
          was_correct,
          match:matches(
            match_date,
            home_team:teams!matches_home_team_id_fkey(name),
            away_team:teams!matches_away_team_id_fkey(name),
            league:leagues(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (predictionsError) throw predictionsError;

      const formattedPredictions = (predictionsData || []).map((p) => ({
        id: p.id,
        predicted_outcome: p.predicted_outcome,
        confidence_score: p.confidence_score,
        actual_outcome: p.actual_outcome,
        was_correct: p.was_correct,
        match: {
          home_team: p.match?.home_team?.name || 'Unknown',
          away_team: p.match?.away_team?.name || 'Unknown',
          match_date: p.match?.match_date || new Date().toISOString(),
          league: p.match?.league?.name || 'Unknown',
        },
      }));

      setPredictions(formattedPredictions);

      const { data: allPredictions, error: allPredictionsError } = await supabase
        .from('predictions')
        .select('was_correct');

      if (allPredictionsError) throw allPredictionsError;

      const evaluatedPredictions = (allPredictions || []).filter((p) => p.was_correct !== null);
      const correctPredictions = evaluatedPredictions.filter((p) => p.was_correct).length;
      const totalEvaluated = evaluatedPredictions.length;
      const accuracy = totalEvaluated > 0 ? Math.round((correctPredictions / totalEvaluated) * 100) : 0;

      let currentStreak = 0;
      let maxStreak = 0;
      const sortedPredictions = [...evaluatedPredictions].reverse();
      
      for (const pred of sortedPredictions) {
        if (pred.was_correct) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }

      const { data: patternAccuracy, error: patternError } = await supabase
        .from('pattern_accuracy')
        .select(`
          total_predictions,
          correct_predictions,
          accuracy_rate,
          template:pattern_templates(name)
        `)
        .order('accuracy_rate', { ascending: false });

      if (patternError) throw patternError;

      const formattedPatternData = (patternAccuracy || []).map((p) => ({
        name: p.template?.name || 'Unknown',
        accuracy: p.accuracy_rate || 0,
        total: p.total_predictions || 0,
      }));

      setPatterns(formattedPatternData);

      const topPattern = formattedPatternData[0]?.name || 'N/A';

      setStats({
        totalPredictions: allPredictions?.length || 0,
        accuracy,
        topPattern,
        winningStreak: maxStreak,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const widgets = useMemo(() => ({
    stats: <DashboardStatsWidget stats={stats} />,
    predictions: <RecentPredictionsWidget predictions={predictions} />,
    patterns: <PatternPerformanceWidget patterns={patterns} />,
  }), [stats, predictions, patterns]);

  if (loading) {
    return (
      <>
        <PageHeader 
          title="Dashboard" 
          metaDescription="Monitor prediction accuracy and performance"
        />
        <div className="text-center py-12 text-muted-foreground">
          Loading dashboard data...
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="Dashboard" 
        metaDescription="Monitor prediction accuracy and performance"
      />
      <AppGrid id="dashboard_page" widgets={widgets} />
    </>
  );
}
