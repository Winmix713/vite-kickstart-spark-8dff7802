import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
interface TransitionMatrixHeatmapProps {
  teamId?: string;
  teamName?: string;
}
interface TransitionMatrixResponse {
  team_id: string;
  matrix: number[][]; // 3x3 probabilities
  counts: number[][]; // 3x3 raw counts
  sampleSize: number;
  confidence: 'low' | 'medium' | 'high';
}
export function TransitionMatrixHeatmap({
  teamId,
  teamName
}: TransitionMatrixHeatmapProps) {
  const {
    data,
    isLoading
  } = useQuery<TransitionMatrixResponse | null>({
    queryKey: ['transition-matrix', teamId, teamName],
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
        } = await supabase.functions.invoke('team-transition-matrix', {
          body: payload
        });
        if (error) throw error;
        return data as TransitionMatrixResponse;
      } catch (e) {
        return null;
      }
    },
    staleTime: 30_000
  });
  if (isLoading) return <Card className="rounded-2xl bg-card ring-1 ring-border">
      <CardHeader>
        <CardTitle>Markov Transition Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">Loading transition matrix...</div>
      </CardContent>
    </Card>;
  if (!data) return null;
  const labels = ['Győzelem', 'Döntetlen', 'Vereség'];
  const getColor = (value: number) => {
    const intensity = Math.max(0, Math.min(1, value));
    const red = Math.round(255 - 155 * intensity);
    const green = Math.round(200 * intensity);
    const blue = 120;
    return `rgb(${red}, ${green}, ${blue})`;
  };
  const confBadge = data.confidence === 'high' ? <Badge variant="default">Magas bizalom</Badge> : data.confidence === 'medium' ? <Badge variant="secondary">Közepes bizalom</Badge> : <Badge variant="secondary">Alacsony bizalom</Badge>;
  return <Card className="rounded-2xl bg-card ring-1 ring-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Markov Transition Matrix</CardTitle>
            <CardDescription>Állapotváltási valószínűségek (következő eredmény az előző alapján)</CardDescription>
          </div>
          {confBadge}
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <div className="inline-grid" style={{
            gridTemplateColumns: `repeat(4, minmax(0, 1fr))`,
            gap: 8
          }}>
              <div></div>
              {labels.map((label, i) => <div key={`col-${i}`} className="text-sm font-medium text-center">{label}</div>)}
              {data.matrix.map((row, i) => <>
                  <div key={`row-label-${i}`} className="text-sm font-medium flex items-center">{labels[i]}</div>
                  {row.map((prob, j) => <Tooltip key={`cell-${i}-${j}`}>
                      <TooltipTrigger asChild>
                        <div className="h-16 w-20 rounded-md grid place-items-center text-xs font-semibold text-foreground border" style={{
                    backgroundColor: getColor(prob),
                    borderColor: 'rgba(255,255,255,0.1)'
                  }}>
                          {(prob * 100).toFixed(0)}%
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm font-medium mb-1">{labels[i]} → {labels[j]}</div>
                        <div className="text-xs text-muted-foreground">
                          Valószínűség: {(prob * 100).toFixed(1)}%<br />
                          Nyers: {data.counts[i][j]} / {data.counts[i].reduce((a, b) => a + b, 0)}
                        </div>
                      </TooltipContent>
                    </Tooltip>)}
                </>)}
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-3">
            Mintaméret: {data.sampleSize} átmenet • Laplace-simítás alkalmazva (K=3)
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>;
}
export default TransitionMatrixHeatmap;