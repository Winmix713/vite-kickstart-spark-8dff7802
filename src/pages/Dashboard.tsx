import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/navigation/Sidebar';
import TopBar from '@/components/TopBar';
import StatisticsCards from '@/components/dashboard/StatisticsCards';
import RecentPredictions from '@/components/dashboard/RecentPredictions';
import PatternPerformanceChart from '@/components/dashboard/PatternPerformanceChart';
import { Skeleton } from '@/components/ui/skeleton';
interface Prediction {
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
interface PatternData {
  name: string;
  accuracy: number;
  total: number;
}
interface RawPrediction {
  id: string;
  predicted_outcome: string;
  confidence_score: number;
  actual_outcome: string | null;
  was_correct: boolean | null;
  match: {
    match_date: string;
    home_team: {
      name: string;
    };
    away_team: {
      name: string;
    };
    league: {
      name: string;
    };
  };
}
interface RawPatternAccuracy {
  total_predictions: number;
  correct_predictions: number;
  accuracy_rate: number;
  template: {
    name: string;
  };
}
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [patternData, setPatternData] = useState<PatternData[]>([]);
  const [stats, setStats] = useState({
    totalPredictions: 0,
    accuracy: 0,
    topPattern: '',
    winningStreak: 0
  });
  useEffect(() => {
    fetchDashboardData();
  }, []);
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch predictions with match details
      const {
        data: predictionsData,
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
      }).limit(10);
      if (predictionsError) throw predictionsError;
      const formattedPredictions = (predictionsData as RawPrediction[])?.map((p: RawPrediction) => ({
        id: p.id,
        predicted_outcome: p.predicted_outcome,
        confidence_score: p.confidence_score,
        actual_outcome: p.actual_outcome,
        was_correct: p.was_correct,
        match: {
          home_team: p.match.home_team.name,
          away_team: p.match.away_team.name,
          match_date: p.match.match_date,
          league: p.match.league.name
        }
      })) || [];
      setPredictions(formattedPredictions);
      // Calculate statistics
      const {
        data: allPredictions,
        error: allPredictionsError
      } = await supabase.from('predictions').select('was_correct');
      if (allPredictionsError) throw allPredictionsError;
      const evaluatedPredictions = allPredictions?.filter(p => p.was_correct !== null) || [];
      const correctPredictions = evaluatedPredictions.filter(p => p.was_correct).length;
      const totalEvaluated = evaluatedPredictions.length;
      const accuracy = totalEvaluated > 0 ? Math.round(correctPredictions / totalEvaluated * 100) : 0;
      // Calculate winning streak
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
      // Fetch pattern performance
      const {
        data: patternAccuracy,
        error: patternError
      } = await supabase.from('pattern_accuracy').select(`
          total_predictions,
          correct_predictions,
          accuracy_rate,
          template:pattern_templates(name)
        `).order('accuracy_rate', {
        ascending: false
      });
      if (patternError) throw patternError;
      const formattedPatternData = (patternAccuracy as RawPatternAccuracy[])?.map((p: RawPatternAccuracy) => ({
        name: p.template.name,
        accuracy: p.accuracy_rate,
        total: p.total_predictions
      })) || [];
      setPatternData(formattedPatternData);
      const topPattern = formattedPatternData[0]?.name || 'N/A';
      setStats({
        totalPredictions: allPredictions?.length || 0,
        accuracy,
        topPattern,
        winningStreak: maxStreak
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-black">
        <Sidebar />
        <TopBar />
        <main className="lg:ml-64 pt-16 lg:pt-0">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <Skeleton className="h-12 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
            <Skeleton className="h-96 mb-8" />
            <Skeleton className="h-96" />
          </div>
        </main>
      </div>;
  }
  return <div className="min-h-screen bg-black">
      <Sidebar />
      <TopBar />
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gradient-emerald mb-2">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Kövesd nyomon a predikciók pontosságát és teljesítményét
            </p>
          </div>

          <StatisticsCards totalPredictions={stats.totalPredictions} accuracy={stats.accuracy} topPattern={stats.topPattern} winningStreak={stats.winningStreak} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <RecentPredictions predictions={predictions} />
            <PatternPerformanceChart data={patternData} />
          </div>
        </div>
      </main>
    </div>;
}