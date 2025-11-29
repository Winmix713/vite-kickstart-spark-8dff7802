#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
   
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const argv = new Set(process.argv.slice(2));
const DRY_RUN = argv.has('--dry-run') || argv.has('-n');
const FORCE = argv.has('--force') || argv.has('-f');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function ensurePhase9Settings() {
  if (DRY_RUN) return;
  await supabase.from('phase9_settings').upsert({ id: 1 }).select();
}

async function seedLeagues() {
  const leagues = [
    { name: 'Premier League', country: 'England', season: '2024/25' },
    { name: 'La Liga', country: 'Spain', season: '2024/25' },
    { name: 'Serie A', country: 'Italy', season: '2024/25' },
    { name: 'Bundesliga', country: 'Germany', season: '2024/25' },
    { name: 'Ligue 1', country: 'France', season: '2024/25' },
  ];
  if (DRY_RUN) return { data: leagues };
  await supabase.from('leagues').upsert(leagues, { onConflict: 'name,season' });
  const { data } = await supabase.from('leagues').select('*').in('name', leagues.map(l => l.name));
  return { data };
}

async function seedTeams(leagueRows) {
  const leagueMap = new Map(leagueRows.map(l => [l.name, l.id]));
  const teamsByLeague = {
    'Premier League': ['Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Tottenham', 'Manchester United'],
    'La Liga': ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Valencia', 'Villarreal'],
    'Serie A': ['Inter', 'AC Milan', 'Juventus', 'Napoli', 'Roma', 'Lazio'],
    'Bundesliga': ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Eintracht Frankfurt', 'Hoffenheim'],
    'Ligue 1': ['PSG', 'Marseille', 'Lyon', 'Monaco', 'Lille', 'Nice'],
  };
  const teamRows = [];
  for (const [leagueName, teamNames] of Object.entries(teamsByLeague)) {
    const league_id = leagueMap.get(leagueName);
    if (!league_id) continue;
    for (const name of teamNames) {
      teamRows.push({ name, league_id });
    }
  }
  if (DRY_RUN) return { data: teamRows };

  // Avoid duplicates by checking existing
  const { data: existing } = await supabase.from('teams').select('name,league_id');
  const existingSet = new Set((existing || []).map(r => `${r.name}|${r.league_id}`));
  const toInsert = teamRows.filter(r => !existingSet.has(`${r.name}|${r.league_id}`));
  if (toInsert.length) await supabase.from('teams').insert(toInsert);

  const { data } = await supabase.from('teams').select('id,name,league_id').in('name', teamRows.map(t => t.name));
  return { data };
}

function pickPairs(items) {
  const pairs = [];
  for (let i = 0; i < items.length - 1; i += 2) {
    pairs.push([items[i], items[i + 1]]);
  }
  return pairs;
}

async function seedMatches(leagueRows, teamRows) {
  const now = new Date();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const byLeague = new Map();
  for (const t of teamRows) {
    const arr = byLeague.get(t.league_id) || [];
    arr.push(t);
    byLeague.set(t.league_id, arr);
  }
  const matches = [];
  for (const league of leagueRows) {
    const teams = byLeague.get(league.id) || [];
    const pairs = pickPairs(teams);
    let offset = 3;
    for (const [home, away] of pairs) {
      matches.push({
        league_id: league.id,
        home_team_id: home.id,
        away_team_id: away.id,
        match_date: new Date(now.getTime() + offset * ONE_DAY).toISOString(),
        status: 'scheduled',
      });
      offset += 2;
    }
  }
  if (DRY_RUN) return { data: matches };

  // Insert avoiding duplicates by unique (match_id) not available, so check approx duplicates
  const { data: existing } = await supabase.from('matches').select('home_team_id,away_team_id,match_date');
  const existed = new Set((existing || []).map(r => `${r.home_team_id}|${r.away_team_id}|${r.match_date?.slice(0,10)}`));
  const toInsert = matches.filter(m => !existed.has(`${m.home_team_id}|${m.away_team_id}|${m.match_date.slice(0,10)}`));
  if (toInsert.length) await supabase.from('matches').insert(toInsert);

  const { data } = await supabase.from('matches').select('id,league_id,home_team_id,away_team_id,match_date').order('match_date');
  return { data };
}

async function seedPatternTemplates() {
  const templates = [
    { name: 'home_winning_streak', description: 'Home team won last 3+ home matches', category: 'form', base_confidence_boost: 8.0 },
    { name: 'away_winning_streak', description: 'Away team won last 3+ away matches', category: 'form', base_confidence_boost: 7.0 },
    { name: 'h2h_dominance', description: 'One team won 3+ of last 5 H2H matches', category: 'h2h', base_confidence_boost: 10.0 },
    { name: 'recent_form_advantage', description: 'Team has 2+ more wins in last 5 matches', category: 'form', base_confidence_boost: 6.0 },
    { name: 'high_scoring_league', description: 'League avg goals > 3.0 per match', category: 'league', base_confidence_boost: 3.0 },
  ];
  if (DRY_RUN) return { data: templates };
  await supabase.from('pattern_templates').upsert(templates, { onConflict: 'name' });
  const { data } = await supabase.from('pattern_templates').select('*');
  return { data };
}

async function seedPredictions(matchRows) {
  const predictions = [];
  for (const m of matchRows.slice(0, 30)) {
    const r = Math.random();
    const outcome = r < 0.45 ? 'home_win' : r < 0.55 ? 'draw' : 'away_win';
    predictions.push({
      match_id: m.id,
      predicted_outcome: outcome,
      confidence_score: Math.round(50 + Math.random() * 40),
      predicted_home_score: Math.floor(Math.random() * 3),
      predicted_away_score: Math.floor(Math.random() * 3),
    });
  }
  if (DRY_RUN) return { data: predictions };

  // Upsert by unique constraint on (match_id)
  for (const p of predictions) {
    await supabase.from('predictions').upsert(p, { onConflict: 'match_id' });
  }
  const { data } = await supabase.from('predictions').select('id, match_id');
  return { data };
}

async function seedModelPerformance() {
  const record = {
    model_version: 'v1.0.0',
    period_start: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    period_end: new Date().toISOString(),
    total_predictions: 120,
    accuracy_overall: 0.62,
    accuracy_winner: 0.58,
    accuracy_btts: 0.66,
    confidence_calibration_score: 0.72,
    league_breakdown: { premier_league: 0.6, la_liga: 0.64 },
  };
  if (DRY_RUN) return { data: [record] };
  await supabase.from('model_performance').insert(record);
  return { data: [record] };
}

async function alreadySeeded() {
  const { data, error } = await supabase.from('leagues').select('count', { count: 'exact', head: true });
  if (error) return false;
  return (data === null ? 0 : 1) && (typeof data === 'number' ? data : 0) > 0; // fallback; count on head query is not directly returned by supabase-js v2
}

async function main() {
  // Simple check to avoid duplicate seeding
  if (!FORCE) {
    const { data, error } = await supabase.from('leagues').select('id').limit(1);
    if (!error && data && data.length > 0) {
       
      console.log('Leagues already exist - skipping seed (use --force to override)');
      return;
    }
  }

   
  console.log(DRY_RUN ? '[DRY RUN] Starting database seed' : 'Starting database seed');

  await ensurePhase9Settings();
  const { data: leagues } = await seedLeagues();
  const { data: teams } = await seedTeams(leagues || []);
  const { data: matches } = await seedMatches(leagues || [], teams || []);
  await seedPatternTemplates();
  await seedPredictions(matches || []);
  await seedModelPerformance();

   
  console.log('Database seed completed');
}

main().catch((e) => {
   
  console.error('Seed failed:', e);
  process.exit(1);
});
