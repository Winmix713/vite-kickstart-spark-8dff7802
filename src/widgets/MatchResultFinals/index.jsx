// styling
import styles from './styles.module.scss';

// components
import Spring from '@components/Spring';
import SelectionList from '@ui/SelectionList';
import MatchResultColorItem from '@components/MatchResultColorItem';
import MatchResultFullCard from '@components/MatchResultFullCard';
import LoadingScreen from '@components/LoadingScreen';

// hooks
import {useState} from 'react';
import { useKnockoutMatches } from '@hooks/useMatches';

// constants
import {FINALS_OPTIONS} from '@constants/selection_options';

// utils
import {getRandomInt} from '@utils/helpers';

const MatchResultFinals = () => {
    const [selected, setSelected] = useState(FINALS_OPTIONS[0].value);

    // Get knockout matches from Supabase
    const { data: knockoutMatches, isLoading, error } = useKnockoutMatches(selected);

    // Transform Supabase data to match expected format
    const transformMatch = (match) => ({
        team1: {
            color: match.home_team.short_name.toLowerCase().replace(' ', '-'),
            country: match.home_team.name,
            club: match.home_team.short_name,
            score: match.home_score || 0,
        },
        team2: {
            color: match.away_team.short_name.toLowerCase().replace(' ', '-'),
            country: match.away_team.name,
            club: match.away_team.short_name,
            score: match.away_score || 0,
        },
    });

    // Fallback empty data structure
    const emptyStageData = [];

    // Show loading state
    if (isLoading) {
        return (
            <Spring className="card">
                <SelectionList options={FINALS_OPTIONS} active={selected} setActive={setSelected} />
                <div className={styles.container}>
                    <div className="flex items-center justify-center h-32">
                        <LoadingScreen />
                    </div>
                </div>
            </Spring>
        );
    }

    // Show error state
    if (error) {
        return (
            <Spring className="card">
                <SelectionList options={FINALS_OPTIONS} active={selected} setActive={setSelected} />
                <div className={styles.container}>
                    <div className="text-center text-red-500 p-4">
                        Error loading knockout matches: {error.message}
                    </div>
                </div>
            </Spring>
        );
    }

    const stageMatches = (knockoutMatches || []).map(transformMatch);
    const randomMatch = stageMatches.length > 0 ? stageMatches[getRandomInt(0, Math.min(4, stageMatches.length - 1))] : null;

    return (
        <Spring className="card">
            <SelectionList options={FINALS_OPTIONS} active={selected} setActive={setSelected} />
            <div className={styles.container}>
                <div className="d-flex flex-column g-20">
                    {
                        stageMatches.length > 0 ? (
                            stageMatches.map((match, index) => (
                                <MatchResultColorItem key={`${selected}-${index}`} match={match} index={index} type="final" />
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                No {selected} matches available
                            </div>
                        )
                    }
                </div>
                {randomMatch && <MatchResultFullCard match={randomMatch} />}
            </div>
        </Spring>
    )
}

export default MatchResultFinals