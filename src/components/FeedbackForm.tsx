import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Save } from 'lucide-react';
import ScoreInput from './ScoreInput';
import HalftimeScoreInput from './HalftimeScoreInput';
interface FeedbackFormProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  onSubmitted: () => void;
}
export default function FeedbackForm({
  matchId,
  homeTeam,
  awayTeam,
  onSubmitted
}: FeedbackFormProps) {
  const [fullTimeHome, setFullTimeHome] = useState<number>(0);
  const [fullTimeAway, setFullTimeAway] = useState<number>(0);
  const [halfTimeHome, setHalfTimeHome] = useState<number | null>(null);
  const [halfTimeAway, setHalfTimeAway] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validation: halftime scores cannot exceed full-time scores
    if (halfTimeHome !== null && halfTimeHome > fullTimeHome) {
      setError('A félidei hazai gólok száma nem lehet nagyobb a végleges eredménynél');
      setSubmitting(false);
      return;
    }
    if (halfTimeAway !== null && halfTimeAway > fullTimeAway) {
      setError('A félidei vendég gólok száma nem lehet nagyobb a végleges eredménynél');
      setSubmitting(false);
      return;
    }
    try {
      const {
        error
      } = await supabase.functions.invoke('submit-feedback', {
        body: {
          matchId,
          homeScore: fullTimeHome,
          awayScore: fullTimeAway,
          halfTimeHomeScore: halfTimeHome,
          halfTimeAwayScore: halfTimeAway
        }
      });
      if (error) throw error;
      setSubmitted(true);
      onSubmitted();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err instanceof Error ? err.message : 'Hiba az eredmény mentése során');
    } finally {
      setSubmitting(false);
    }
  }
  if (submitted) {
    return <Alert className="mt-6">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          Eredmény sikeresen rögzítve! A pattern accuracy frissült.
        </AlertDescription>
      </Alert>;
  }
  return <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="w-5 h-5" />
          Mérkőzés eredmény rögzítése
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <ScoreInput homeTeam={homeTeam} awayTeam={awayTeam} homeScore={fullTimeHome} awayScore={fullTimeAway} onHomeScoreChange={setFullTimeHome} onAwayScoreChange={setFullTimeAway} />

          <HalftimeScoreInput homeTeam={homeTeam} awayTeam={awayTeam} homeScore={halfTimeHome} awayScore={halfTimeAway} onHomeScoreChange={setHalfTimeHome} onAwayScoreChange={setHalfTimeAway} maxHomeScore={fullTimeHome} maxAwayScore={fullTimeAway} />

          {error && <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>}

          <Button type="submit" disabled={submitting} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {submitting ? 'Mentés...' : 'Eredmény mentése'}
          </Button>
        </form>
      </CardContent>
    </Card>;
}