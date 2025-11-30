import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
interface ScoreInputProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  onHomeScoreChange: (score: number) => void;
  onAwayScoreChange: (score: number) => void;
  maxScore?: number;
  showVisualIndicators?: boolean;
}
export default function ScoreInput({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  onHomeScoreChange,
  onAwayScoreChange,
  maxScore = 20,
  showVisualIndicators = true
}: ScoreInputProps) {
  const adjustScore = (currentScore: number, delta: number, onChange: (score: number) => void) => {
    const newScore = Math.max(0, Math.min(maxScore, currentScore + delta));
    onChange(newScore);
  };
  const renderBalls = (count: number) => {
    if (!showVisualIndicators || count === 0) return null;
    return <div className="flex gap-1 flex-wrap justify-center min-h-[24px]">
        {Array.from({
        length: Math.min(count, 10)
      }).map((_, i) => <span key={i} className="text-yellow-400 text-sm">⚽</span>)}
        {count > 10 && <span className="text-xs text-muted-foreground">+{count - 10}</span>}
      </div>;
  };
  return <div className="space-y-3">
      <h3 className="text-sm font-semibold text-center text-muted-foreground">Végleges eredmény</h3>
      <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
        {/* Home Team */}
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-sm font-medium text-foreground mb-2">{homeTeam}</p>
            <div className="flex items-center justify-center gap-2">
              <Button type="button" variant="outline" size="icon" onClick={() => adjustScore(homeScore, -1, onHomeScoreChange)} disabled={homeScore === 0} className="h-10 w-10 rounded-lg">
                <Minus className="h-4 w-4" />
              </Button>
              <div className="w-16 h-16 rounded-xl bg-primary/10 ring-1 ring-primary/30 grid place-items-center">
                <span className="text-3xl font-bold text-foreground">{homeScore}</span>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => adjustScore(homeScore, 1, onHomeScoreChange)} disabled={homeScore === maxScore} className="h-10 w-10 rounded-lg">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {renderBalls(homeScore)}
          </div>
        </div>

        {/* VS Separator */}
        <div className="flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary grid place-items-center ring-2 ring-background shadow-lg">
            <span className="text-xs font-bold text-primary-foreground">VS</span>
          </div>
        </div>

        {/* Away Team */}
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-sm font-medium text-foreground mb-2">{awayTeam}</p>
            <div className="flex items-center justify-center gap-2">
              <Button type="button" variant="outline" size="icon" onClick={() => adjustScore(awayScore, -1, onAwayScoreChange)} disabled={awayScore === 0} className="h-10 w-10 rounded-lg">
                <Minus className="h-4 w-4" />
              </Button>
              <div className="w-16 h-16 rounded-xl bg-secondary/10 ring-1 ring-secondary/30 grid place-items-center">
                <span className="text-3xl font-bold text-foreground">{awayScore}</span>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => adjustScore(awayScore, 1, onAwayScoreChange)} disabled={awayScore === maxScore} className="h-10 w-10 rounded-lg">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {renderBalls(awayScore)}
          </div>
        </div>
      </div>
    </div>;
}