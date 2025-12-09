import React from "react";
import styles from "./styles.module.scss";
import Spring from "@components/Spring";

const LeagueTable = ({ league = "Premier League", season = "2024" }) => {
  const teams = [
    {
      position: 1,
      name: "Manchester City",
      played: 28,
      won: 21,
      drawn: 4,
      lost: 3,
      points: 67,
    },
    {
      position: 2,
      name: "Arsenal",
      played: 28,
      won: 20,
      drawn: 5,
      lost: 3,
      points: 65,
    },
    {
      position: 3,
      name: "Liverpool",
      played: 28,
      won: 19,
      drawn: 6,
      lost: 3,
      points: 63,
    },
    {
      position: 4,
      name: "Aston Villa",
      played: 28,
      won: 17,
      drawn: 6,
      lost: 5,
      points: 57,
    },
    {
      position: 5,
      name: "Tottenham",
      played: 28,
      won: 16,
      drawn: 5,
      lost: 7,
      points: 53,
    },
    {
      position: 6,
      name: "Manchester Utd",
      played: 28,
      won: 14,
      drawn: 6,
      lost: 8,
      points: 48,
    },
  ];

  const getPositionClass = (position) => {
    if (position <= 4) return styles.champions;
    if (position <= 5) return styles.europa;
    return "";
  };

  return (
    <Spring className="card card-padded h-100">
      <div className={styles.header}>
        <h3 className={styles.title}>{league}</h3>
        <span className={styles.season}>Season {season}</span>
      </div>

      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <div className={styles.posCol}>#</div>
          <div className={styles.teamCol}>Team</div>
          <div className={styles.statCol}>P</div>
          <div className={styles.statCol}>W</div>
          <div className={styles.statCol}>D</div>
          <div className={styles.statCol}>L</div>
          <div className={styles.ptsCol}>Pts</div>
        </div>

        <div className={styles.tableBody}>
          {teams.map((team) => (
            <div
              key={team.position}
              className={`${styles.tableRow} ${getPositionClass(team.position)}`}
            >
              <div className={styles.posCol}>
                <span className={styles.position}>{team.position}</span>
              </div>
              <div className={styles.teamCol}>
                <span className={styles.teamName}>{team.name}</span>
              </div>
              <div className={styles.statCol}>{team.played}</div>
              <div className={styles.statCol}>{team.won}</div>
              <div className={styles.statCol}>{team.drawn}</div>
              <div className={styles.statCol}>{team.lost}</div>
              <div className={styles.ptsCol}>
                <span className={styles.points}>{team.points}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span
            className={`${styles.legendDot} ${styles.championsLegend}`}
          ></span>
          <span className={styles.legendLabel}>Champions League</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.europaLegend}`}></span>
          <span className={styles.legendLabel}>Europa League</span>
        </div>
      </div>
    </Spring>
  );
};

LeagueTable.meta = {
  id: "league_table",
  name: "League Table",
  category: "Football",
  defaultSize: { w: 3, h: 3 },
  props: {
    league: { type: "string", default: "Premier League" },
    season: { type: "string", default: "2024" },
  },
};

export default LeagueTable;
