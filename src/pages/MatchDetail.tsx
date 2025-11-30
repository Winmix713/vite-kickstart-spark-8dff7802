import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Brain, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import PredictionDisplay from '@/components/PredictionDisplay';
import FeedbackForm from '@/components/FeedbackForm';
interface Match {
  id: string;
  match_date: string;
  status: string;
  home_score?: number;
  away_score?: number;
  home_team: {
    id: string;
    name: string;
  };
  away_team: {
    id: string;
    name: string;
  };
  league: {
    name: string;
  };
}
interface Prediction {
  id: string;
  predicted_outcome: string;
  confidence_score: number;
  btts_prediction: boolean;
  actual_outcome?: string;
  was_correct?: boolean;
}
interface Pattern {
  template_name: string;
  confidence_boost: number;
  data: Record<string, unknown>;
}
export default function MatchDetail() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [formScores, setFormScores] = useState<{
    home: number;
    away: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchMatch = useCallback(async () => {
    setLoading(true);
    const {
      data,
      error
    } = await supabase.from('matches').select(`
        *,
        home_team:teams!home_team_id(id, name),
        away_team:teams!away_team_id(id, name),
        league:leagues(name)
      `).eq('id', id).single();
    if (error) {
      console.error('Error fetching match:', error);
      setError('Mérkőzés nem található');
    } else {
      setMatch(data);
    }
    setLoading(false);
  }, [id]);
  const fetchPrediction = useCallback(async () => {
    const {
      data
    } = await supabase.from('predictions').select('*').eq('match_id', id).maybeSingle();
    setPrediction(data);
  }, [id]);
  useEffect(() => {
    if (id) {
      fetchMatch();
      fetchPrediction();
    }
  }, [id, fetchMatch, fetchPrediction]);
  async function handleAnalyze() {
    if (!match) return;
    setAnalyzing(true);
    setError(null);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('analyze-match', {
        body: {
          matchId: id
        }
      });
      if (error) throw error;
      setPrediction(data.prediction);
      setPatterns(data.patterns || []);
      setFormScores(data.form_scores || null);
    } catch (err) {
      console.error('Error analyzing match:', err);
      setError(err instanceof Error ? err.message : 'Hiba az elemzés során');
    } finally {
      setAnalyzing(false);
    }
  }
  function handleFeedbackSubmitted() {
    fetchPrediction();
    fetchMatch();
  }
  if (loading) {
    return <div className="container mx-auto p-6 max-w-4xl">
        <p className="text-center text-muted-foreground">Betöltés...</p>
      </div>;
  }
  if (!match) {
    return <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertDescription>Mérkőzés nem található</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Vissza
        </Button>
      </div>;
  }
  return <div className="container mx-auto p-6 max-w-4xl">
      <Button onClick={() => navigate('/dashboard')} variant="outline" className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Vissza a Dashboard-ra
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant={match.status === 'scheduled' ? 'default' : 'secondary'}>
              {match.status === 'scheduled' ? 'Jövőbeli mérkőzés' : 'Befejezett mérkőzés'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {format(new Date(match.match_date), 'yyyy. MMMM dd.')}
            </span>
          </div>
          <CardTitle className="text-2xl">{match.league.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
              <div className="text-center flex-1">
                <p className="text-2xl font-bold">{match.home_team.name}</p>
                {match.status === 'finished' && <p className="text-4xl font-bold mt-2">{match.home_score}</p>}
              </div>

              <div className="px-6">
                <span className="text-3xl font-bold text-muted-foreground">VS</span>
              </div>

              <div className="text-center flex-1">
                <p className="text-2xl font-bold">{match.away_team.name}</p>
                {match.status === 'finished' && <p className="text-4xl font-bold mt-2">{match.away_score}</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>}

      {!prediction && match.status === 'scheduled' && <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Pattern Detection</h3>
              <p className="text-muted-foreground mb-4">
                Indítsd el az AI elemzést, hogy predikciót kapj erre a mérkőzésre
              </p>
              <Button onClick={handleAnalyze} disabled={analyzing} size="lg" className="w-full max-w-md">
                <TrendingUp className="w-4 h-4 mr-2" />
                {analyzing ? 'Elemzés folyamatban...' : 'Elemzés indítása'}
              </Button>
            </div>
          </CardContent>
        </Card>}

      {prediction && <>
          <PredictionDisplay prediction={prediction} patterns={patterns} formScores={formScores} />

          {match.status === 'finished' && !prediction.actual_outcome && <FeedbackForm matchId={match.id} homeTeam={match.home_team.name} awayTeam={match.away_team.name} onSubmitted={handleFeedbackSubmitted} />}

          {prediction.actual_outcome && <Alert className="mt-6">
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    Predikció eredmény: <strong>{prediction.was_correct ? 'HELYES ✅' : 'HELYTELEN ❌'}</strong>
                  </span>
                  <Badge variant={prediction.was_correct ? 'default' : 'destructive'}>
                    {prediction.actual_outcome === 'home_win' ? 'Hazai győzelem' : prediction.actual_outcome === 'away_win' ? 'Vendég győzelem' : 'Döntetlen'}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>}
        </>}
    </div>;
}