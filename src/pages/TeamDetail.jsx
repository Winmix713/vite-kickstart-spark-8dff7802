import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, TrendingUp } from 'lucide-react';

// Layout
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';
import WidgetGroup from '@components/WidgetGroup';

// Services
import { supabase } from '@/integrations/supabase/client';

const TeamInfoWidget = ({ team, loading }) => {
  if (loading) {
    return (
      <WidgetGroup>
        <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6 text-muted-foreground">
          Loading team details...
        </div>
      </WidgetGroup>
    );
  }

  if (!team) {
    return (
      <WidgetGroup>
        <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6 text-muted-foreground">
          Team not found
        </div>
      </WidgetGroup>
    );
  }

  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{team.name}</h2>
            {team.league && (
              <p className="text-muted-foreground">{team.league.name}</p>
            )}
          </div>
        </div>

        {team.stadium && (
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Stadium: </span>{team.stadium}
          </div>
        )}
      </div>
    </WidgetGroup>
  );
};

const TeamStatsWidget = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <WidgetGroup>
        <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6 text-muted-foreground">
          Loading statistics...
        </div>
      </WidgetGroup>
    );
  }

  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Statistics</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Played</div>
            <div className="text-2xl font-bold text-foreground">{stats.played || 0}</div>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10">
            <div className="text-xs text-muted-foreground mb-1">Won</div>
            <div className="text-2xl font-bold text-green-500">{stats.won || 0}</div>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10">
            <div className="text-xs text-muted-foreground mb-1">Drawn</div>
            <div className="text-2xl font-bold text-yellow-500">{stats.drawn || 0}</div>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10">
            <div className="text-xs text-muted-foreground mb-1">Lost</div>
            <div className="text-2xl font-bold text-red-500">{stats.lost || 0}</div>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10">
            <div className="text-xs text-muted-foreground mb-1">Goals For</div>
            <div className="text-2xl font-bold text-blue-500">{stats.goalsFor || 0}</div>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10">
            <div className="text-xs text-muted-foreground mb-1">Points</div>
            <div className="text-2xl font-bold text-purple-500">{stats.points || 0}</div>
          </div>
        </div>
      </div>
    </WidgetGroup>
  );
};

const TeamDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        const { data, error: teamError } = await supabase
          .from('teams')
          .select(`
            id,
            name,
            stadium,
            league:leagues(id, name)
          `)
          .eq('id', id)
          .single();

        if (teamError) throw teamError;
        setTeam(data);

        // Generate mock statistics based on team
        const mockStats = {
          played: Math.floor(Math.random() * 10) + 20,
          won: Math.floor(Math.random() * 15) + 5,
          drawn: Math.floor(Math.random() * 5) + 2,
          lost: Math.floor(Math.random() * 10) + 3,
          goalsFor: Math.floor(Math.random() * 40) + 20,
          goalsAgainst: Math.floor(Math.random() * 30) + 10,
          points: 0,
        };
        mockStats.points = mockStats.won * 3 + mockStats.drawn;

        setStats(mockStats);
      } catch (err) {
        console.error('Error fetching team:', err);
        setError('Failed to load team details');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [id]);

  const widgets = useMemo(() => ({
    info: <TeamInfoWidget team={team} loading={loading} />,
    stats: <TeamStatsWidget stats={stats} loading={loading} />,
  }), [team, stats, loading]);

  return (
    <>
      <div className="mb-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary hover:text-primary/90 transition font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <PageHeader 
          title="Team Detail" 
          metaDescription="Team statistics and information"
        />
      </div>
      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-sm">
          {error}
        </div>
      )}
      <AppGrid id="team_detail_page" widgets={widgets} />
    </>
  );
};

export default TeamDetailPage;
