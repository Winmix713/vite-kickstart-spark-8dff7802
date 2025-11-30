import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TeamOption } from "@/data/teamOptions";
interface MatchCardProps {
  match: {
    home: TeamOption | null;
    away: TeamOption | null;
  };
  index: number;
  availableTeams: {
    home: TeamOption[];
    away: TeamOption[];
  };
  onMatchChange: (index: number, teamValue: string, side: "home" | "away") => void;
}
const MatchCard = ({
  match,
  index,
  availableTeams,
  onMatchChange
}: MatchCardProps) => {
  return <div className="glass-card rounded-2xl p-4 animate-slide-in-bottom" style={{
    animationDelay: `${index * 0.05}s`
  }}>
      <div className="text-center mb-3">
        <span className="text-sm text-gray-400">Mérkőzés #{index + 1}</span>
      </div>

      <div className="space-y-3">
        <Select value={match.home?.value} onValueChange={value => onMatchChange(index, value, "home")}>
          <SelectTrigger className="glass-card border-white/10 bg-white/5 hover:bg-white/10">
            <SelectValue placeholder="Hazai csapat" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-white/10">
            {availableTeams.home.map(team => <SelectItem key={team.value} value={team.value} className="hover:bg-white/10">
                {team.label}
              </SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex items-center justify-center">
          <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-bold">
            VS
          </span>
        </div>

        <Select value={match.away?.value} onValueChange={value => onMatchChange(index, value, "away")}>
          <SelectTrigger className="glass-card border-white/10 bg-white/5 hover:bg-white/10">
            <SelectValue placeholder="Vendég csapat" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-white/10">
            {availableTeams.away.map(team => <SelectItem key={team.value} value={team.value} className="hover:bg-white/10">
                {team.label}
              </SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>;
};
export default MatchCard;