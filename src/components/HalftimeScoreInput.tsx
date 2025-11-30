import { Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
interface HalftimeScoreInputProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  onHomeScoreChange: (score: number | null) => void;
  onAwayScoreChange: (score: number | null) => void;
  maxHomeScore: number;
  maxAwayScore: number;
}
export default function HalftimeScoreInput({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  onHomeScoreChange,
  onAwayScoreChange,
  maxHomeScore,
  maxAwayScore
}: HalftimeScoreInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const adjustScore = (currentScore: number | null, delta: number, onChange: (score: number | null) => void, maxScore: number) => {
    const current = currentScore ?? 0;
    const newScore = Math.max(0, Math.min(maxScore, current + delta));
    onChange(newScore);
  };
  const toggleExpand = () => {
    if (isExpanded) {
      // Reset scores when collapsing
      onHomeScoreChange(null);
      onAwayScoreChange(null);
    }
    setIsExpanded(!isExpanded);
  };
  return <div className="space-y-3">
      <Button type="button" variant="ghost" onClick={toggleExpand} className="w-full justify-between text-sm font-medium hover:bg-muted/50">
        <span className="flex items-center gap-2">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Félidei eredmény megadása (opcionális)
        </span>
        {!isExpanded && (homeScore !== null || awayScore !== null) && <span className="text-xs text-primary font-semibold">
            {homeScore ?? 0} - {awayScore ?? 0}
          </span>}
      </Button>

      {isExpanded && <div className="p-4 rounded-lg bg-muted/30 ring-1 ring-border space-y-3 animate-in fade-in-0 slide-in-from-top-2">
          <h4 className="text-xs font-semibold text-center text-muted-foreground uppercase tracking-wide">
            Félidő
          </h4>
          <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
            {/* Home Team Halftime */}
            <div className="text-center space-y-2">
              <p className="text-xs font-medium text-muted-foreground truncate">{homeTeam}</p>
              <div className="flex items-center justify-center gap-1.5">
                <Button type="button" variant="outline" size="icon" onClick={() => adjustScore(homeScore, -1, onHomeScoreChange, maxHomeScore)} disabled={(homeScore ?? 0) === 0} className="h-8 w-8 rounded-md">
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="w-12 h-12 rounded-lg bg-primary/5 ring-1 ring-primary/20 grid place-items-center">
                  <span className="text-xl font-bold text-foreground">{homeScore ?? 0}</span>
                </div>
                <Button type="button" variant="outline" size="icon" onClick={() => adjustScore(homeScore, 1, onHomeScoreChange, maxHomeScore)} disabled={(homeScore ?? 0) === maxHomeScore} className="h-8 w-8 rounded-md">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Max: {maxHomeScore}</p>
            </div>

            {/* VS Separator */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 grid place-items-center ring-1 ring-border">
              <span className="text-[10px] font-bold text-muted-foreground">HT</span>
            </div>

            {/* Away Team Halftime */}
            <div className="text-center space-y-2">
              <p className="text-xs font-medium text-muted-foreground truncate">{awayTeam}</p>
              <div className="flex items-center justify-center gap-1.5">
                <Button type="button" variant="outline" size="icon" onClick={() => adjustScore(awayScore, -1, onAwayScoreChange, maxAwayScore)} disabled={(awayScore ?? 0) === 0} className="h-8 w-8 rounded-md">
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="w-12 h-12 rounded-lg bg-secondary/5 ring-1 ring-secondary/20 grid place-items-center">
                  <span className="text-xl font-bold text-foreground">{awayScore ?? 0}</span>
                </div>
                <Button type="button" variant="outline" size="icon" onClick={() => adjustScore(awayScore, 1, onAwayScoreChange, maxAwayScore)} disabled={(awayScore ?? 0) === maxAwayScore} className="h-8 w-8 rounded-md">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Max: {maxAwayScore}</p>
            </div>
          </div>
        </div>}
    </div>;
}