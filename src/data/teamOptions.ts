export const LEAGUE_KEYS = ["angol", "spanyol"] as const;
export type LeagueKey = typeof LEAGUE_KEYS[number];
export interface TeamOption {
  value: string;
  label: string;
}
export const LEAGUE_METADATA: Record<LeagueKey, {
  supabaseName: string;
  displayName: string;
}> = {
  angol: {
    supabaseName: "Premier League",
    displayName: "Angol Bajnokság"
  },
  spanyol: {
    supabaseName: "La Liga",
    displayName: "Spanyol Bajnokság"
  }
};
export const LEAGUE_TEAM_OPTIONS: Record<LeagueKey, TeamOption[]> = {
  angol: [{
    value: "Arsenal",
    label: "London Ágyúk"
  }, {
    value: "Aston Villa",
    label: "Aston Oroszlán"
  }, {
    value: "Chelsea",
    label: "Chelsea"
  }, {
    value: "Liverpool",
    label: "Liverpool"
  }, {
    value: "Manchester City",
    label: "Manchester Kék"
  }, {
    value: "Manchester United",
    label: "Vörös Ördögök"
  }, {
    value: "Tottenham Hotspur",
    label: "Tottenham"
  }, {
    value: "Newcastle United",
    label: "Newcastle"
  }, {
    value: "West Ham United",
    label: "West Ham"
  }, {
    value: "Brentford",
    label: "Brentford"
  }, {
    value: "Brighton & Hove Albion",
    label: "Brighton"
  }, {
    value: "Crystal Palace",
    label: "Crystal Palace"
  }, {
    value: "Fulham",
    label: "Fulham"
  }, {
    value: "Everton",
    label: "Everton"
  }, {
    value: "Nottingham Forest",
    label: "Nottingham"
  }, {
    value: "Wolverhampton Wanderers",
    label: "Wolverhampton"
  }],
  spanyol: [{
    value: "FC Barcelona",
    label: "Barcelona"
  }, {
    value: "Real Madrid CF",
    label: "Madrid Fehér"
  }, {
    value: "Atletico Madrid",
    label: "Madrid Piros"
  }, {
    value: "Sevilla FC",
    label: "Sevilla Piros"
  }, {
    value: "Real Betis",
    label: "Sevilla Zöld"
  }, {
    value: "Valencia CF",
    label: "Valencia"
  }, {
    value: "Villarreal CF",
    label: "Villarreal"
  }, {
    value: "Real Sociedad",
    label: "San Sebastian"
  }, {
    value: "Athletic Club",
    label: "Bilbao"
  }, {
    value: "CA Osasuna",
    label: "Osasuna"
  }, {
    value: "Girona FC",
    label: "Girona"
  }, {
    value: "RCD Mallorca",
    label: "Mallorca"
  }, {
    value: "Celta Vigo",
    label: "Vigo"
  }, {
    value: "Getafe CF",
    label: "Getafe"
  }, {
    value: "UD Las Palmas",
    label: "Las Palmas"
  }, {
    value: "Deportivo Alaves",
    label: "Alaves"
  }]
};