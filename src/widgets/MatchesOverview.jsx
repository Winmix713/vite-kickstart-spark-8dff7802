// components
import Spring from '@components/Spring';
import ScrollContainer from '@components/ScrollContainer';
import {TabsList} from '@mui/base/TabsList';
import {TabPanel} from '@mui/base/TabPanel';
import {Tabs} from '@mui/base/Tabs';
import MatchCard from '@components/MatchCard';
import TabButton from '@ui/TabButton';
import LoadingScreen from '@components/LoadingScreen';

// hooks
import useMeasure from 'react-use-measure';
import {useState, useEffect, useRef} from 'react';
import { useLiveMatches, useFinishedMatches } from '@hooks/useMatches';

const MatchesOverview = () => {
    const [activeTab, setActiveTab] = useState('live');
    const [ref, {height}] = useMeasure();
    const trackRef = useRef(null);

    // Use real data from Supabase
    const { data: liveMatches, isLoading: liveLoading, error: liveError } = useLiveMatches();
    const { data: finishedMatches, isLoading: finishedLoading, error: finishedError } = useFinishedMatches();

    useEffect(() => {
        trackRef.current && trackRef.current.scrollTo(0, 0);
    }, [activeTab]);

    // Show loading state
    if (liveLoading || finishedLoading) {
        return (
            <Spring className="card h-3">
                <div className="flex items-center justify-center h-32">
                    <LoadingScreen />
                </div>
            </Spring>
        );
    }

    // Show error state
    if (liveError || finishedError) {
        return (
            <Spring className="card h-3">
                <div className="text-center text-red-500 p-4">
                    Error loading matches: {liveError?.message || finishedError?.message}
                </div>
            </Spring>
        );
    }

    // Transform matches to match expected format
    const transformMatch = (match) => ({
        id: match.id,
        home_team: {
            name: match.home_team.name,
            short_name: match.home_team.short_name,
            logo_url: match.home_team.logo_url
        },
        away_team: {
            name: match.away_team.name,
            short_name: match.away_team.short_name,
            logo_url: match.away_team.logo_url
        },
        league: {
            name: match.league.name,
            logo_url: match.league.logo_url
        },
        home_score: match.home_score,
        away_score: match.away_score,
        match_date: match.match_date,
        venue: match.venue,
        status: match.status,
        active: match.status === 'live'
    });

    const matchesLive = (liveMatches || []).map(transformMatch);
    const matchesFinished = (finishedMatches || []).slice(0, 10).map(transformMatch);

    return (
        <Spring className="card h-3">
            <Tabs className="h-100" value={activeTab}>
                <div className="card-padded" ref={ref}>
                    <TabsList className="tab-nav col-2">
                        <TabButton title="Live"
                                   onClick={() => setActiveTab('live')}
                                   active={activeTab === 'live'}/>
                        <TabButton title="Finished"
                                   onClick={() => setActiveTab('finished')}
                                   active={activeTab === 'finished'}/>
                    </TabsList>
                </div>
                <ScrollContainer height={height}>
                    <div className="track" style={{padding: '0 var(--card-padding)'}} ref={trackRef}>
                        <TabPanel className="h-100" value="live" onClick={() => setActiveTab('live')}>
                            <div className="d-flex flex-column g-24" style={{paddingBottom: 24}}>
                                {
                                    matchesLive.length > 0 ? (
                                        matchesLive.map((match, index) => (
                                            <MatchCard key={match.id} match={match} index={index}/>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 py-8">
                                            No live matches at the moment
                                        </div>
                                    )
                                }
                            </div>
                        </TabPanel>
                        <TabPanel className="h-100" value="finished" onClick={() => setActiveTab('finished')}>
                            <div className="d-flex flex-column g-24" style={{paddingBottom: 24}}>
                                {
                                    matchesFinished.length > 0 ? (
                                        matchesFinished.map((match, index) => (
                                            <MatchCard key={match.id} match={match} index={index}/>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 py-8">
                                            No finished matches available
                                        </div>
                                    )
                                }
                            </div>
                        </TabPanel>
                    </div>
                </ScrollContainer>
            </Tabs>
        </Spring>
    )
}

export default MatchesOverview