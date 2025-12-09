import React from 'react';
import styles from './styles.module.scss';
import Spring from '@components/Spring';

const TeamStats = ({ teamId = 'bayern', season = '2024' }) => {
  const stats = [
    { label: 'Matches Played', value: 28 },
    { label: 'Wins', value: 20 },
    { label: 'Draws', value: 5 },
    { label: 'Losses', value: 3 },
    { label: 'Goals For', value: 72 },
    { label: 'Goals Against', value: 28 },
  ];

  return (
    <Spring className="card card-padded h-100">
      <div className={styles.header}>
        <h3 className={styles.title}>Team Statistics</h3>
        <div className={styles.metadata}>
          <span className={styles.team}>{teamId.toUpperCase()}</span>
          <span className={styles.season}>Season {season}</span>
        </div>
      </div>
      
      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} className={styles.statItem}>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>
      
      <div className={styles.footer}>
        <div className={styles.winRate}>
          <span className={styles.winRateLabel}>Win Rate</span>
          <span className={styles.winRateValue}>71.4%</span>
        </div>
      </div>
    </Spring>
  );
};

TeamStats.meta = {
  id: 'team_stats',
  name: 'Team Stats',
  category: 'Football',
  defaultSize: { w: 2, h: 2 },
  props: {
    teamId: { type: 'string', default: 'bayern' },
    season: { type: 'string', default: '2024' },
  },
  styleVariants: [
    {
      slug: 'default',
      label: 'Default',
      description: 'Standard team stats display',
      supportedTokens: ['colors', 'spacing', 'radii', 'shadows'],
    },
    {
      slug: 'compact',
      label: 'Compact',
      description: 'Reduced padding for space-constrained layouts',
      supportedTokens: ['colors', 'spacing'],
    },
    {
      slug: 'minimal',
      label: 'Minimal',
      description: 'Clean display without borders or shadows',
      supportedTokens: ['colors'],
    },
  ],
};

export default TeamStats;
