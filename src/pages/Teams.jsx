import { useState, useMemo } from 'react';
import { Users } from 'lucide-react';

// Layout
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';
import WidgetGroup from '@components/WidgetGroup';

// Data
import { LEAGUE_TEAM_OPTIONS, LEAGUE_METADATA } from '@/data/teamOptions';

const generateTeamStats = (teamNames) => {
  return teamNames.map(name => {
    const played = Math.floor(Math.random() * 10) + 20;
    const won = Math.floor(Math.random() * played * 0.5);
    const lost = Math.floor(Math.random() * (played - won) * 0.6);
    const drawn = played - won - lost;
    const goalsFor = Math.floor(Math.random() * 40) + 20;
    const goalsAgainst = Math.floor(Math.random() * 40) + 15;
    const points = won * 3 + drawn;
    
    const formResults = ['W', 'D', 'L'];
    const form = Array.from({ length: 8 }, () => 
      formResults[Math.floor(Math.random() * formResults.length)]
    );
    
    const recentForm = form.slice(-5);
    const formScore = Math.round(
      (recentForm.filter(r => r === 'W').length * 100 + 
       recentForm.filter(r => r === 'D').length * 50) / 5
    );

    return {
      name,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points,
      form,
      formScore
    };
  });
};

const TeamsTableWidget = ({ teams, leagueName }) => {
  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Team</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">M</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">W</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">D</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">L</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">GF</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">GA</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">GD</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Pts</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Form</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, idx) => (
                <tr key={team.name} className="border-b border-border hover:bg-muted/30 transition">
                  <td className="px-4 py-3 text-sm text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{team.name}</td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">{team.played}</td>
                  <td className="px-4 py-3 text-center text-sm text-green-500 font-medium">{team.won}</td>
                  <td className="px-4 py-3 text-center text-sm text-yellow-500 font-medium">{team.drawn}</td>
                  <td className="px-4 py-3 text-center text-sm text-red-500 font-medium">{team.lost}</td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">{team.goalsFor}</td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">{team.goalsAgainst}</td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">{team.goalDifference}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-primary">{team.points}</td>
                  <td className="px-4 py-3 text-center text-sm">
                    <div className="flex gap-0.5 justify-center">
                      {team.form.map((result, i) => (
                        <span
                          key={i}
                          className={`w-5 h-5 rounded-sm flex items-center justify-center text-xs font-semibold text-white ${
                            result === 'W' ? 'bg-green-500' :
                            result === 'D' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </WidgetGroup>
  );
};

const TeamsPage = () => {
  const [league, setLeague] = useState('angol');
  const teamStats = generateTeamStats(LEAGUE_TEAM_OPTIONS[league].map((team) => team.label));
  
  const widgets = useMemo(() => ({
    teams_table: <TeamsTableWidget teams={teamStats} leagueName={LEAGUE_METADATA[league].displayName} />,
  }), [teamStats, league]);

  return (
    <>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full ring-1 ring-primary/20 bg-primary/10 px-2.5 py-1 mb-2">
          <Users className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] text-primary font-semibold">Teams</span>
        </div>
        <h2 className="text-lg font-semibold text-foreground mt-2 mb-4">Select League</h2>
        <div className="inline-flex items-center rounded-lg bg-muted p-1 ring-1 ring-border mb-6">
          <button
            onClick={() => setLeague('angol')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
              league === 'angol'
                ? 'bg-card text-foreground ring-1 ring-border shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            English League
          </button>
          <button
            onClick={() => setLeague('spanyol')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
              league === 'spanyol'
                ? 'bg-card text-foreground ring-1 ring-border shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Spanish League
          </button>
        </div>
      </div>

      <PageHeader 
        title={`Teams - ${LEAGUE_METADATA[league].displayName}`} 
        metaDescription="Team statistics and standings"
      />
      <AppGrid id="teams_page" widgets={widgets} />
    </>
  );
}

export default TeamsPage;
