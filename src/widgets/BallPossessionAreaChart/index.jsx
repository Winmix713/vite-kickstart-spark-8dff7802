// styling
import styles from './styles.module.scss';

// components
import Spring from '@components/Spring';
import ClubInfo from '@components/ClubInfo';
import {AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis} from 'recharts';
import ChartTooltip from '@ui/ChartTooltip';
import Navigator from '@ui/Navigator';

// hooks
import useArrayNav from '@hooks/useArrayNav';
import {useThemeProvider} from '@contexts/themeContext';

// hooks
import { useMatchStatistics } from '@hooks/useMatches';

const BallPossessionAreaChart = ({ matchId }) => {
    const {direction} = useThemeProvider();
    const { data: ballPossessionData, isLoading, error } = useMatchStatistics(matchId);
    const isRTL = direction === 'rtl';

    const areaProps = {
        type: 'monotone',
        strokeWidth: 3,
        activeDot: {stroke: 'var(--widget)'},
    }

    // Show loading state
    if (isLoading) {
        return (
            <Spring className="card h-1 d-flex flex-column g-10">
                <div className={`${styles.header} card_header`}>
                    <ClubInfo id="realmadrid" title="Ball possession" subtitle="Loading..."/>
                </div>
                <div className="flex items-center justify-center flex-1">
                    <div className="text-gray-500">Loading statistics...</div>
                </div>
            </Spring>
        );
    }

    // Show error state
    if (error) {
        return (
            <Spring className="card h-1 d-flex flex-column g-10">
                <div className={`${styles.header} card_header`}>
                    <ClubInfo id="realmadrid" title="Ball possession" subtitle="Error"/>
                </div>
                <div className="flex items-center justify-center flex-1">
                    <div className="text-red-500">Error loading statistics</div>
                </div>
            </Spring>
        );
    }

    // Use the first team's data if available, otherwise show empty state
    const data = ballPossessionData && ballPossessionData.length > 0 ? ballPossessionData[0] : null;
    const {index, navigate} = useArrayNav(ballPossessionData || []);

    if (!data) {
        return (
            <Spring className="card h-1 d-flex flex-column g-10">
                <div className={`${styles.header} card_header`}>
                    <ClubInfo id="realmadrid" title="Ball possession" subtitle="No data"/>
                </div>
                <div className="flex items-center justify-center flex-1">
                    <div className="text-gray-500">No statistics available</div>
                </div>
            </Spring>
        );
    }

    return (
        <Spring className="card h-1 d-flex flex-column g-10">
            <div className={`${styles.header} card_header`}>
                <ClubInfo id="realmadrid" title="Ball possession" subtitle={data.label}/>
                <Navigator className={styles.header_navigator} text={data.label} handler={navigate}/>
            </div>
            <ResponsiveContainer className="flex-1" width="100%" height="100%">
                <AreaChart data={data.data} margin={{top: 4, right: 0, left: 0, bottom: 0}}>
                    <Tooltip cursor={false} content={<ChartTooltip multi/>}/>
                    <XAxis reversed={isRTL} hide/>
                    <YAxis orientation={isRTL ? 'right' : 'left'} hide/>
                    <Area dataKey="a"
                          stroke="var(--purple)"
                          fill="var(--purple)"
                          fillOpacity={0.8}
                          {...areaProps}/>
                    <Area dataKey="b"
                          stroke="var(--accent)"
                          fill="var(--accent)"
                          fillOpacity={0}
                          {...areaProps}/>
                </AreaChart>
            </ResponsiveContainer>
        </Spring>
    )
}

export default BallPossessionAreaChart