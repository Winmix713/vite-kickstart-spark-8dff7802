import { useState } from "react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
interface TeamStats {
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[]; // Array of 'W', 'D', 'L'
  formScore: number;
}
interface TeamStatisticsTableProps {
  teams: TeamStats[];
  leagueName: string;
}
type SortField = 'name' | 'points' | 'goalDifference' | 'formScore';
type SortDirection = 'asc' | 'desc';
export default function TeamStatisticsTable({
  teams,
  leagueName
}: TeamStatisticsTableProps) {
  const [sortField, setSortField] = useState<SortField>('points');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  const sortedTeams = [...teams].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'name') {
      return multiplier * a.name.localeCompare(b.name);
    }
    return multiplier * ((a[sortField] || 0) - (b[sortField] || 0));
  });
  const getFormIcon = (result: string) => {
    switch (result) {
      case 'W':
        return <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 grid place-items-center text-xs font-bold">W</div>;
      case 'D':
        return <div className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 grid place-items-center text-xs font-bold">D</div>;
      case 'L':
        return <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 grid place-items-center text-xs font-bold">L</div>;
      default:
        return null;
    }
  };
  const getFormTrendIcon = (formScore: number) => {
    if (formScore >= 70) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (formScore >= 40) return <Minus className="w-4 h-4 text-yellow-400" />;
    return <TrendingDown className="w-4 h-4 text-red-400" />;
  };
  return <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">{leagueName} - Statisztikák</h2>
        <p className="text-sm text-muted-foreground mt-1">Csapatok teljesítménye és forma</p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="w-8 text-muted-foreground">#</TableHead>
              <TableHead className="min-w-[200px]">
                <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="h-8 -ml-3 hover:bg-transparent">
                  Csapat
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-center text-muted-foreground">M</TableHead>
              <TableHead className="text-center text-muted-foreground">Gy</TableHead>
              <TableHead className="text-center text-muted-foreground">D</TableHead>
              <TableHead className="text-center text-muted-foreground">V</TableHead>
              <TableHead className="text-center text-muted-foreground">G+</TableHead>
              <TableHead className="text-center text-muted-foreground">G-</TableHead>
              <TableHead className="text-center">
                <Button variant="ghost" size="sm" onClick={() => handleSort('goalDifference')} className="h-8 hover:bg-transparent">
                  GK
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button variant="ghost" size="sm" onClick={() => handleSort('points')} className="h-8 hover:bg-transparent">
                  Pont
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-center">Forma (utolsó 5)</TableHead>
              <TableHead className="text-center">
                <Button variant="ghost" size="sm" onClick={() => handleSort('formScore')} className="h-8 hover:bg-transparent">
                  Forma
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTeams.map((team, index) => <TableRow key={team.name} className="hover:bg-muted/50 transition-colors cursor-pointer group">
                <TableCell className="text-center text-muted-foreground font-medium">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <Link to={`/teams/${encodeURIComponent(team.name)}`} className="flex items-center gap-3 group-hover:text-primary transition-colors">
                    <div className="h-10 w-10 rounded-full bg-muted ring-1 ring-border grid place-items-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{team.name.charAt(0)}</span>
                    </div>
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {team.name}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="text-center text-muted-foreground font-medium">
                  {team.played}
                </TableCell>
                <TableCell className="text-center text-muted-foreground font-medium">
                  {team.won}
                </TableCell>
                <TableCell className="text-center text-muted-foreground font-medium">
                  {team.drawn}
                </TableCell>
                <TableCell className="text-center text-muted-foreground font-medium">
                  {team.lost}
                </TableCell>
                <TableCell className="text-center text-muted-foreground font-medium">
                  {team.goalsFor}
                </TableCell>
                <TableCell className="text-center text-muted-foreground font-medium">
                  {team.goalsAgainst}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={team.goalDifference >= 0 ? "default" : "destructive"} className="font-bold">
                    {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg bg-primary/10 text-primary font-bold ring-1 ring-primary/30">
                    {team.points}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    {team.form.slice(-5).map((result, i) => <div key={i}>
                        {getFormIcon(result)}
                      </div>)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    {getFormTrendIcon(team.formScore)}
                    <span className="text-sm font-semibold text-foreground">
                      {team.formScore}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </div>

      <div className="p-4 bg-muted/30 border-t border-border">
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground">M:</span> Mérkőzések
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground">Gy:</span> Győzelem
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground">D:</span> Döntetlen
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground">V:</span> Vereség
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground">GK:</span> Gólkülönbség
          </div>
        </div>
      </div>
    </div>;
}