import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Shield, TrendingUp, Home } from "lucide-react";
interface StreakAnalysisProps {
  teamId?: string;
  teamName?: string;
}
interface StreakResponse {
  team_id: string;
  streaks: {
    overall_winning?: {
      pattern_type: string;
      pattern_name: string;
      confidence: number;
      strength: number;
      metadata: {
        streak_length: number;
      };
    } | null;
    clean_sheet?: {
      pattern_type: string;
      pattern_name: string;
      confidence: number;
      strength: number;
      metadata: {
        streak_length: number;
      };
    } | null;
    btts?: {
      pattern_type: string;
      pattern_name: string;
      confidence: number;
      strength: number;
      metadata: {
        streak_length: number;
      };
    } | null;
    home_winning?: number | null;
  };
}
export function StreakAnalysis({
  teamId,
  teamName
}: StreakAnalysisProps) {
  const {
    data,
    isLoading,
    isError
  } = useQuery<StreakResponse | null>({
    queryKey: ["team-streaks", teamId, teamName],
    queryFn: async () => {
      try {
        const payload = teamId ? {
          teamId
        } : {
          teamName
        };
        const {
          data,
          error
        } = await supabase.functions.invoke("team-streaks", {
          body: payload
        });
        if (error) throw error;
        return data as StreakResponse;
      } catch (e) {
        // Gracefully degrade on unauthorized or missing function
        return null;
      }
    },
    staleTime: 30_000
  });
  return <Card className="rounded-2xl bg-card ring-1 ring-border">
      <CardHeader>
        <CardTitle>Sorozatok és trendek</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="text-sm text-muted-foreground">Loading streaks...</div> : isError || !data ? <div className="text-sm text-muted-foreground">Streak adatok nem elérhetők ehhez a csapathoz.</div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.streaks.overall_winning ? <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-2"><Flame className="w-4 h-4 text-primary" />
                  <span className="font-medium">Győzelmi széria</span>
                </div>
                <div className="text-2xl font-bold">{data.streaks.overall_winning.metadata.streak_length}</div>
                <div className="text-sm text-muted-foreground">Hossz (meccs)</div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="default">Bizalom: {data.streaks.overall_winning.confidence}%</Badge>
                  <Badge variant="secondary">Erő: {data.streaks.overall_winning.strength}/100</Badge>
                </div>
              </div> : null}

            {data.streaks.clean_sheet ? <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-secondary" />
                  <span className="font-medium">Kapott gól nélkül</span>
                </div>
                <div className="text-2xl font-bold">{data.streaks.clean_sheet.metadata.streak_length}</div>
                <div className="text-sm text-muted-foreground">Hossz (meccs)</div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="default">Bizalom: {data.streaks.clean_sheet.confidence}%</Badge>
                  <Badge variant="secondary">Védelem: {data.streaks.clean_sheet.strength}/100</Badge>
                </div>
              </div> : null}

            {data.streaks.btts ? <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">BTTS széria</span>
                </div>
                <div className="text-2xl font-bold">{data.streaks.btts.metadata.streak_length}</div>
                <div className="text-sm text-muted-foreground">Hossz (meccs)</div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="default">Bizalom: {data.streaks.btts.confidence}%</Badge>
                  <Badge variant="secondary">Mindkét csapat gól</Badge>
                </div>
              </div> : null}

            {data.streaks.home_winning ? <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-2"><Home className="w-4 h-4 text-primary" />
                  <span className="font-medium">Hazai széria</span>
                </div>
                <div className="text-2xl font-bold">{data.streaks.home_winning}</div>
                <div className="text-sm text-muted-foreground">Hossz (meccs)</div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary">Otthoni előny</Badge>
                </div>
              </div> : null}
          </div>}
      </CardContent>
    </Card>;
}
export default StreakAnalysis;