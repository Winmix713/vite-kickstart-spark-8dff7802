// styling
import styled from 'styled-components';
import theme from 'styled-theming';

// components
import Spring from '@components/Spring';
import LeagueHeader from '@components/LeagueHeader';
import TeamScoreRow, {StyledRow} from '@components/TeamScoreRow';
import LoadingScreen from '@components/LoadingScreen';

// hooks
import {useThemeProvider} from '@contexts/themeContext';
import { useLeagueTable } from '@hooks/useTeams';

// assets
import english_premier from '@assets/clubs/english_premier.webp';

const TableHeader = styled(StyledRow)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${theme('theme', {
    light: 'var(--body)',
    dark: '#414D55'
  })};
  color: var(--btn-text) !important;

  &.ltr {
    padding: 0 4px 0 10px;
  }

  &.rtl {
    padding: 0 10px 0 4px;
  }

  div {
    background: ${theme('theme', {
      light: 'var(--body)',
      dark: '#414D55'
    })};
  }

  .points {
    margin-right: 4px;
  }
`;

const LeagueStandings = ({ leagueId = 'default-league-id' }) => {
    const {direction} = useThemeProvider();
    
    // Use real data from Supabase
    const { data: teamsWithStats, isLoading, error } = useLeagueTable(leagueId);

    // Fallback to empty array while loading
    const tableData = teamsWithStats || [];

    // Transform data to match expected format
    const transformedData = tableData.map((team, index) => ({
      name: team.name,
      color: team.short_name.toLowerCase().replace(' ', '-'),
      pts: team.points,
      w: team.wins,
      d: team.draws,
      l: team.losses,
      logo_url: team.logo_url
    }));

    // Show loading state
    if (isLoading) {
        return (
            <Spring className="card d-flex flex-column g-20 card-padded">
                <div className="flex items-center justify-center h-32">
                    <LoadingScreen />
                </div>
            </Spring>
        );
    }

    // Show error state
    if (error) {
        return (
            <Spring className="card d-flex flex-column g-20 card-padded">
                <div className="text-center text-red-500">
                    Error loading league standings: {error.message}
                </div>
            </Spring>
        );
    }

    return (
        <Spring className="card d-flex flex-column g-20 card-padded">
            <LeagueHeader title={<>English <span className="d-block">Premier League</span></>}
                          img={english_premier}
                          variant="compact"/>
            <div className="d-flex flex-column g-4">
                <TableHeader className={`label h6 ${direction}`}>
                    <span className="flex-1">Club</span>
                    <div className="points">
                        <span>W</span>
                        <span>D</span>
                        <span>L</span>
                    </div>
                    <span>PTS</span>
                </TableHeader>
                <div className="d-flex flex-column g-1">
                    {
                        transformedData.map((item, index) => (
                            <TeamScoreRow key={item.name} data={item} index={index} variant="league"/>
                        ))
                    }
                    {transformedData.length === 0 && (
                        <div className="text-center text-gray-500 py-4">
                            No team data available
                        </div>
                    )}
                </div>
            </div>
        </Spring>
    )
}

export default LeagueStandings