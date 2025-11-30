import type * as React from "react";
import { Trophy, Target, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
export interface TeamStatsSummaryProps {
  teamName: string;
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  form: string;
  averageGoals: number;
  cssScore: number;
  rank?: number;
}
export function TeamStatsSummary({
  teamName,
  totalMatches,
  wins,
  draws,
  losses,
  form,
  averageGoals,
  cssScore,
  rank
}: TeamStatsSummaryProps) {
  const formLetters = form.split("");
  const getFormBadgeVariant = (letter: string) => {
    switch (letter) {
      case "W":
        return "default";
      case "D":
        return "secondary";
      case "L":
        return "destructive";
      default:
        return "outline";
    }
  };
  const getFormLabel = (letter: string) => {
    switch (letter) {
      case "W":
        return "Győzelem";
      case "D":
        return "Döntetlen";
      case "L":
        return "Vereség";
      default:
        return letter;
    }
  };
  const getCSSBadgeVariant = (score: number) => {
    if (score >= 8.5) return "default";
    if (score >= 7) return "secondary";
    return "destructive";
  };
  return <Card className="w-full bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-transparent border-purple-500/20 hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-bold mb-2">{teamName}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Forma:</span>
              <div className="flex gap-1">
                {formLetters.map((letter, index) => <Badge key={index} variant={getFormBadgeVariant(letter) as any} className="w-7 h-7 flex items-center justify-center p-0 text-xs font-bold" title={getFormLabel(letter)}>
                    {letter}
                  </Badge>)}
              </div>
            </div>
          </div>
          {rank && <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
              <Trophy className="h-3 w-3 mr-1" />#{rank}
            </Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Activity className="h-4 w-4" />} label="Összes Meccs" value={totalMatches.toString()} />
          <StatCard icon={<Trophy className="h-4 w-4 text-green-500" />} label="Győzelmek" value={wins.toString()} subValue={`${(wins / totalMatches * 100).toFixed(0)}%`} />
          <StatCard icon={<Target className="h-4 w-4 text-blue-500" />} label="Átlag Gólok" value={averageGoals.toFixed(1)} />
          <StatCard icon={<Activity className="h-4 w-4" />} label="CSS Score" value={<Badge variant={getCSSBadgeVariant(cssScore) as any} className="text-base">
                {cssScore.toFixed(1)}
              </Badge>} />
        </div>
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">{wins}</p>
            <p className="text-xs text-muted-foreground">Győzelem</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-600">{draws}</p>
            <p className="text-xs text-muted-foreground">Döntetlen</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{losses}</p>
            <p className="text-xs text-muted-foreground">Vereség</p>
          </div>
        </div>
      </CardContent>
    </Card>;
}
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subValue?: string;
}
function StatCard({
  icon,
  label,
  value,
  subValue
}: StatCardProps) {
  return <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold">{value}</span>
        {subValue && <span className="text-xs text-muted-foreground">{subValue}</span>}
      </div>
    </div>;
}