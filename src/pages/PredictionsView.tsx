import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/navigation/Sidebar';
import TopBar from '@/components/TopBar';
import Footer from '@/components/Footer';
import RecentPredictions from '@/components/dashboard/RecentPredictions';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, RefreshCcw, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
interface PredictionListItem {
  id: string;
  match: {
    home_team: string;
    away_team: string;
    match_date: string;
    league: string;
  };
  predicted_outcome: string;
  confidence_score: number;
  actual_outcome: string | null;
  was_correct: boolean | null;
}
interface SupabasePredictionRow {
  id: string;
  predicted_outcome: string;
  confidence_score: number;
  actual_outcome: string | null;
  was_correct: boolean | null;
  match: {
    match_date?: string;
    home_team?: {
      name: string;
    } | null;
    away_team?: {
      name: string;
    } | null;
    league?: {
      name: string;
    } | null;
  } | null;
}
const PredictionsView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<PredictionListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadPredictions();
  }, []);
  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        data,
        error: predictionsError
      } = await supabase.from('predictions').select(`
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
        `).order('created_at', {
        ascending: false
      }).limit(25);
      if (predictionsError) {
        throw predictionsError;
      }
      const rows = (data ?? []) as SupabasePredictionRow[];
      const formatted: PredictionListItem[] = rows.map(item => ({
        id: item.id,
        predicted_outcome: item.predicted_outcome,
        confidence_score: item.confidence_score,
        actual_outcome: item.actual_outcome,
        was_correct: item.was_correct,
        match: {
          home_team: item.match?.home_team?.name ?? 'Ismeretlen hazai',
          away_team: item.match?.away_team?.name ?? 'Ismeretlen vendég',
          match_date: item.match?.match_date ?? new Date().toISOString(),
          league: item.match?.league?.name ?? 'Ismeretlen liga'
        }
      }));
      setPredictions(formatted);
    } catch (err) {
      console.error('Error loading predictions:', err);
      setError('Nem sikerült betölteni a predikciókat. Próbáld újra később.');
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen">
      <Sidebar />
      <TopBar />
      <main className="relative">
        <div className="ml-0 md:ml-[84px] py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  Predikciók áttekintése
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                  Kövesd nyomon az AI által készített predikciókat, frissítsd a
                  listát és indíts új elemzéseket közvetlenül a felületről.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={loadPredictions} disabled={loading} className="gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                  Lista frissítése
                </Button>
                <Button onClick={() => navigate('/predictions/new')} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Új predikciók
                </Button>
              </div>
            </div>

            {error && <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>}

            {loading ? <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div> : <RecentPredictions predictions={predictions} />}
          </div>
        </div>
      </main>
      <Footer />
    </div>;
};
export default PredictionsView;