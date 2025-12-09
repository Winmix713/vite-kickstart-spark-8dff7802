import { useMemo } from 'react';

// layout components
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';

// widgets
import MatchesSegmentChart from '@widgets/MatchesSegmentChart';
import LiveMatches from '@widgets/LiveMatches';
import TeamStatsSlider from '@widgets/TeamStatsSlider';
import MonthMatches from '@widgets/MonthMatches';
import MatchResultColor from '@widgets/MatchResultColor';

const Championships = () => {
    const widgets = useMemo(() => ({
        segment_chart: <MatchesSegmentChart />,
        live_matches: <LiveMatches variant="small" />,
        team_stats: <TeamStatsSlider />,
        month_matches: <MonthMatches />,
        match_result: <MatchResultColor />
    }), []);

    return (
        <>
            <PageHeader title="Championships" />
            <AppGrid id="championships" widgets={widgets} />
        </>
    );
}

export default Championships;