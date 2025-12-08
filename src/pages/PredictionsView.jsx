import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCcw, Sparkles } from 'lucide-react';

// Layout
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';
import WidgetGroup from '@components/WidgetGroup';

// Services
import { supabase } from '@/integrations/supabase/client';

const PredictionsListWidget = ({ predictions, loading, onRefresh }) => {
  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Predictions</h3>
          <button 
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-1 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading predictions...
          </div>
        ) : predictions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No predictions available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Match</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">League</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Prediction</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Confidence</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Result</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((pred) => (
                  <tr key={pred.id} className="border-b border-border hover:bg-muted/30 transition">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {pred.match.home_team} vs {pred.match.away_team}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{pred.match.league}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{pred.predicted_outcome}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-primary">
                      {Math.round(pred.confidence_score)}%
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {pred.actual_outcome ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-card/50">
                          {pred.actual_outcome}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {pred.was_correct === true && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-500">✓ Correct</span>
                      )}
                      {pred.was_correct === false && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-500">✗ Wrong</span>
                      )}
                      {pred.was_correct === null && (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </WidgetGroup>
  );
};

const PredictionsViewPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: predictionsError } = await supabase
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
        .limit(25);

      if (predictionsError) {
        throw predictionsError;
      }

      const formatted = (data || []).map((item) => ({
        id: item.id,
        predicted_outcome: item.predicted_outcome,
        confidence_score: item.confidence_score,
        actual_outcome: item.actual_outcome,
        was_correct: item.was_correct,
        match: {
          home_team: item.match?.home_team?.name || 'Unknown Home',
          away_team: item.match?.away_team?.name || 'Unknown Away',
          match_date: item.match?.match_date || new Date().toISOString(),
          league: item.match?.league?.name || 'Unknown League',
        },
      }));

      setPredictions(formatted);
    } catch (err) {
      console.error('Error loading predictions:', err);
      setError('Failed to load predictions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const widgets = useMemo(() => ({
    predictions: <PredictionsListWidget predictions={predictions} loading={loading} onRefresh={loadPredictions} />,
  }), [predictions, loading]);

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader 
          title="Predictions Overview" 
          metaDescription="Track and review AI-generated predictions"
        />
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/predictions/new')}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition font-medium flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            New Predictions
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-sm">
          {error}
        </div>
      )}

      <AppGrid id="predictions_page" widgets={widgets} />
    </>
  );
};

export default PredictionsViewPage;
