import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
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
interface RecentPredictionsProps {
  predictions: Prediction[];
}
export default function RecentPredictions({
  predictions
}: RecentPredictionsProps) {
  const getOutcomeText = (outcome: string) => {
    if (outcome === "home_win") return "Hazai győzelem";
    if (outcome === "away_win") return "Vendég győzelem";
    return "Döntetlen";
  };
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return "text-primary";
    if (confidence >= 50) return "text-secondary";
    return "text-muted-foreground";
  };
  return <Card className="glass-card border-border animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Legutóbbi Predikciók</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Mérkőzés</TableHead>
                <TableHead>Liga</TableHead>
                <TableHead>Dátum</TableHead>
                <TableHead>Predikció</TableHead>
                <TableHead>Magabiztosság</TableHead>
                <TableHead className="text-right">Eredmény</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {predictions.length === 0 ? <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Még nincsenek predikciók
                  </TableCell>
                </TableRow> : predictions.map(prediction => <TableRow key={prediction.id} className="border-border hover:bg-white/5">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{prediction.match.home_team}</span>
                        <span className="text-muted-foreground text-xs">vs</span>
                        <span>{prediction.match.away_team}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        {prediction.match.league}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(prediction.match.match_date), "yyyy.MM.dd")}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {getOutcomeText(prediction.predicted_outcome)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${getConfidenceColor(prediction.confidence_score)}`}>
                        {prediction.confidence_score.toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {prediction.was_correct === null ? <Badge variant="secondary" className="bg-muted text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          Folyamatban
                        </Badge> : prediction.was_correct ? <Badge className="bg-primary/20 text-primary border-primary/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Helyes
                        </Badge> : <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">
                          <XCircle className="w-3 h-3 mr-1" />
                          Hibás
                        </Badge>}
                    </TableCell>
                  </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>;
}