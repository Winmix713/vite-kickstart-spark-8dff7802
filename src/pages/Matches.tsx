import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/navigation/Sidebar';
import TopBar from '@/components/TopBar';
import { Calendar } from 'lucide-react';
import type { League, Match } from '@/types/database';
import PageLoading from '@/components/ui/PageLoading';
import { EmptyStatePlaceholder } from '@/components/EmptyStatePlaceholder';
const Matches = () => {
  const [leagueType, setLeagueType] = useState<'angol' | 'spanyol'>('angol');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  // Fetch leagues
  const {
    data: leagues,
    isLoading: leaguesLoading
  } = useQuery({
    queryKey: ['leagues', leagueType],
    queryFn: async () => {
      const {
        data,
        error
      } = await (supabase as any).from('leagues').select('*').eq('league_type', leagueType).order('season_number', {
        ascending: false
      });
      if (error) throw error;
      return data as League[];
    }
  });
  // Auto-select latest league
  if (leagues && leagues.length > 0 && !selectedLeagueId) {
    setSelectedLeagueId(leagues[0].id);
  }
  // Fetch matches
  const {
    data: matches,
    isLoading: matchesLoading
  } = useQuery({
    queryKey: ['matches', selectedLeagueId],
    queryFn: async () => {
      if (!selectedLeagueId) return [];
      const {
        data,
        error
      } = await (supabase as any).from('matches').select('*').eq('league_id', selectedLeagueId).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data as Match[];
    },
    enabled: !!selectedLeagueId
  });
  return <div className="min-h-screen">
      <Sidebar />
      <TopBar />
      <main className="ml-0 md:ml-[84px] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full ring-1 ring-primary/20 bg-primary/10 px-2.5 py-1 mb-2">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-primary font-semibold">
                Mérkőzések
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl tracking-tight text-foreground font-semibold">
              Mérkőzések
            </h1>
            <p className="text-muted-foreground mt-1">
              Válassz bajnokságot és szezont a mérkőzések megtekintéséhez.
            </p>

            {/* League Type Selector */}
            <div className="mt-4 inline-flex items-center rounded-lg bg-muted p-1 ring-1 ring-border">
              <button onClick={() => {
              setLeagueType('angol');
              setSelectedLeagueId(null);
            }} className={`px-4 py-2 rounded-md text-sm font-semibold transition ${leagueType === 'angol' ? 'bg-card text-foreground ring-1 ring-border shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                Angol Bajnokság
              </button>
              <button onClick={() => {
              setLeagueType('spanyol');
              setSelectedLeagueId(null);
            }} className={`px-4 py-2 rounded-md text-sm font-semibold transition ${leagueType === 'spanyol' ? 'bg-card text-foreground ring-1 ring-border shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                Spanyol Bajnokság
              </button>
            </div>

            {/* Season Selector */}
            {leagues && leagues.length > 0 && <div className="mt-3 inline-flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Szezon:</span>
                <select value={selectedLeagueId || ''} onChange={e => setSelectedLeagueId(e.target.value)} className="px-3 py-1.5 rounded-md bg-card text-foreground ring-1 ring-border text-sm">
                  {leagues.map(league => <option key={league.id} value={league.id}>
                      {league.season_number}. szezon ({league.match_count}{' '}
                      mérkőzés)
                    </option>)}
                </select>
              </div>}
          </div>

          {leaguesLoading ? <PageLoading size="lg" message="Bajnokságok betöltése..." showSkeleton={false} /> : !leagues || leagues.length === 0 ? <EmptyStatePlaceholder icon={<Calendar className="w-12 h-12" />} title="Még nincsenek feltöltött szezónok" description="Ehhez a bajnoksághoz még nincsenek feltöltött szezónok. Tölts fel mérkőzés adatokat a Vezérlőpult oldalon!" actionLabel="Vezérlőpult megnyitása" onAction={() => window.scrollTo({
          top: 0,
          behavior: 'smooth'
        })} variant="default" /> : matchesLoading ? <PageLoading size="lg" message="Mérkőzések betöltése..." showSkeleton={false} /> : !matches || matches.length === 0 ? <EmptyStatePlaceholder icon={<Calendar className="w-12 h-12" />} title="Nincsenek mérkőzések ebben a szezonban" description="Válassz másik szezont vagy tölts fel újabb mérkőzés adatokat!" variant="minimal" /> : <div className="flex flex-col gap-3 max-w-3xl">
              {matches.map(match => <div key={match.id} className="rounded-[20px] p-4 hover:ring-primary/30 transition flex items-center justify-between gap-6" style={{
            width: '630px',
            height: '60px',
            background: 'linear-gradient(90deg, #060707 0%, #171818 100%)',
            border: '1px solid #202021',
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.04), 0 5px 4.75px 0.25px rgba(0, 0, 0, 0.25)'
          }}>
                  <div className="flex items-center gap-2 min-w-[60px]">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">
                      {match.match_time}
                    </span>
                  </div>

                  <div className="flex-1 text-right">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      {match.home_team}
                    </h3>
                  </div>

                  <div className="flex flex-col items-center gap-0.5">
                    <div className="px-5 py-1.5 rounded-lg bg-muted/80 ring-1 ring-border/50">
                      <span className="text-base font-bold text-foreground">
                        {match.full_time_home_goals} -{' '}
                        {match.full_time_away_goals}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      (HT: {match.half_time_home_goals}-
                      {match.half_time_away_goals})
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      {match.away_team}
                    </h3>
                  </div>
                </div>)}
            </div>}
        </div>
      </main>
    </div>;
};
export default Matches;