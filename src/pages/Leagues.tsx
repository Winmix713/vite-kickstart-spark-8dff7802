import React, { useState } from 'react';
import Sidebar from '@/components/navigation/Sidebar';
import TopBar from '@/components/TopBar';
import { Trophy } from 'lucide-react';
const leagueStandings = {
  angol: [{
    position: 1,
    team: 'Liverpool',
    played: 12,
    won: 9,
    drawn: 2,
    lost: 1,
    points: 29
  }, {
    position: 2,
    team: 'Manchester Kék',
    played: 12,
    won: 8,
    drawn: 3,
    lost: 1,
    points: 27
  }, {
    position: 3,
    team: 'London Ágyúk',
    played: 12,
    won: 7,
    drawn: 4,
    lost: 1,
    points: 25
  }, {
    position: 4,
    team: 'Chelsea',
    played: 12,
    won: 7,
    drawn: 3,
    lost: 2,
    points: 24
  }, {
    position: 5,
    team: 'Aston Oroszlán',
    played: 12,
    won: 6,
    drawn: 3,
    lost: 3,
    points: 21
  }, {
    position: 6,
    team: 'Tottenham',
    played: 12,
    won: 6,
    drawn: 2,
    lost: 4,
    points: 20
  }, {
    position: 7,
    team: 'Newcastle',
    played: 12,
    won: 5,
    drawn: 4,
    lost: 3,
    points: 19
  }, {
    position: 8,
    team: 'Brighton',
    played: 12,
    won: 5,
    drawn: 3,
    lost: 4,
    points: 18
  }],
  spanyol: [{
    position: 1,
    team: 'Madrid Fehér',
    played: 12,
    won: 9,
    drawn: 2,
    lost: 1,
    points: 29
  }, {
    position: 2,
    team: 'Barcelona',
    played: 12,
    won: 8,
    drawn: 3,
    lost: 1,
    points: 27
  }, {
    position: 3,
    team: 'Madrid Piros',
    played: 12,
    won: 7,
    drawn: 3,
    lost: 2,
    points: 24
  }, {
    position: 4,
    team: 'Girona',
    played: 12,
    won: 6,
    drawn: 4,
    lost: 2,
    points: 22
  }, {
    position: 5,
    team: 'Bilbao',
    played: 12,
    won: 6,
    drawn: 3,
    lost: 3,
    points: 21
  }, {
    position: 6,
    team: 'San Sebastian',
    played: 12,
    won: 5,
    drawn: 4,
    lost: 3,
    points: 19
  }, {
    position: 7,
    team: 'Valencia',
    played: 12,
    won: 5,
    drawn: 3,
    lost: 4,
    points: 18
  }, {
    position: 8,
    team: 'Sevilla Piros',
    played: 12,
    won: 4,
    drawn: 5,
    lost: 3,
    points: 17
  }]
};
const Leagues = () => {
  const [league, setLeague] = useState<'angol' | 'spanyol'>('angol');
  const standings = leagueStandings[league];
  return <div className="min-h-screen">
      <Sidebar />
      <TopBar />
      <main className="ml-0 md:ml-[84px] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full ring-1 ring-primary/20 bg-primary/10 px-2.5 py-1 mb-2">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-primary font-semibold">
                Bajnokságok
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl tracking-tight text-foreground font-semibold">
              Bajnoki tabella
            </h1>
            <p className="text-muted-foreground mt-1">
              Válassz bajnokságot és nézd meg az aktuális állást.
            </p>

            {/* League Selector */}
            <div className="mt-4 inline-flex items-center rounded-lg bg-muted p-1 ring-1 ring-border">
              <button onClick={() => setLeague('angol')} className={`px-4 py-2 rounded-md text-sm font-semibold transition ${league === 'angol' ? 'bg-card text-foreground ring-1 ring-border shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                Angol Bajnokság
              </button>
              <button onClick={() => setLeague('spanyol')} className={`px-4 py-2 rounded-md text-sm font-semibold transition ${league === 'spanyol' ? 'bg-card text-foreground ring-1 ring-border shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                Spanyol Bajnokság
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Csapat
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                      M
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                      Gy
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                      D
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                      V
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                      P
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map(team => <tr key={team.position} className="border-b border-border hover:bg-muted/30 transition">
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {team.position}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">
                        {team.team}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {team.played}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {team.won}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {team.drawn}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {team.lost}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-primary">
                        {team.points}
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>;
};
export default Leagues;