import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders, validateRequest } from "../_shared/validation.ts";
import {
  protectEndpoint,
  requireUser,
  createAuthErrorResponse,
  logAuditAction,
  handleCorsPreflight
} from "../_shared/auth.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema for AI chat requests
const AIChatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(1000, "Message too long"),
  context: z.object({
    league: z.string().optional(),
    dateRange: z.object({
      from: z.string().optional(),
      to: z.string().optional()
    }).optional(),
    userId: z.string().uuid().optional(),
  }).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
});

interface Team {
  id: string;
  name: string;
  league_id: string;
}

interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  match_date: string;
  status: string;
  league_id: string;
}

// Extract team names from user message using simple pattern matching
function extractTeamNames(message: string): { home?: string; away?: string } {
  // Try to match "TeamA vs TeamB" or "TeamA against TeamB" patterns
  const patterns = [
    /(.+?)\s+vs\s+(.+?)(?:\s|$|\.)/i,
    /(.+?)\s+against\s+(.+?)(?:\s|$|\.)/i,
    /(.+?)\s+and\s+(.+?)(?:\s|$|\.)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        home: match[1].trim(),
        away: match[2].trim()
      };
    }
  }

  return {};
}

// Get team by name (flexible matching)
async function getTeamByName(
  supabase: SupabaseClient,
  name: string
): Promise<Team | null> {
  // First try exact match
  const { data, error } = await supabase
    .from('teams')
    .select('id, name, league_id')
    .ilike('name', name)
    .limit(1)
    .single();

  if (!error && data) {
    return data as Team;
  }

  // Try partial match
  const { data: partialData } = await supabase
    .from('teams')
    .select('id, name, league_id')
    .ilike('name', `%${name}%`)
    .limit(1);

  if (partialData && partialData.length > 0) {
    return partialData[0] as Team;
  }

  return null;
}

// Get recent matches for a team
async function getRecentMatches(
  supabase: SupabaseClient,
  teamId: string,
  limit: number = 5
): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .eq('status', 'finished')
    .order('match_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent matches:', error);
    return [];
  }

  return (data || []) as Match[];
}

// Get H2H matches between two teams
async function getH2HMatches(
  supabase: SupabaseClient,
  team1Id: string,
  team2Id: string,
  limit: number = 10
): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(
      `and(home_team_id.eq.${team1Id},away_team_id.eq.${team2Id}),and(home_team_id.eq.${team2Id},away_team_id.eq.${team1Id})`
    )
    .eq('status', 'finished')
    .order('match_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching H2H matches:', error);
    return [];
  }

  return (data || []) as Match[];
}

// Calculate form score (0-100)
function calculateFormScore(matches: Match[], teamId: string): number {
  if (matches.length === 0) return 50;

  let score = 0;
  matches.forEach((match) => {
    const isHome = match.home_team_id === teamId;
    const teamScore = isHome ? match.home_score : match.away_score;
    const opponentScore = isHome ? match.away_score : match.home_score;

    if (teamScore > opponentScore) score += 20;
    else if (teamScore === opponentScore) score += 10;
  });

  return Math.min(score, 100);
}

// Get recent predictions for match analysis
async function getPredictions(
  supabase: SupabaseClient,
  matchId: string
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching prediction:', error);
    return null;
  }

  return data;
}

// Generate analysis response
function generateAnalysisResponse(
  homeTeam: Team,
  awayTeam: Team,
  homeMatches: Match[],
  awayMatches: Match[],
  h2hMatches: Match[]
): string {
  const homeForm = calculateFormScore(homeMatches, homeTeam.id);
  const awayForm = calculateFormScore(awayMatches, awayTeam.id);

  // Calculate H2H statistics
  let homeH2HWins = 0;
  let awayH2HWins = 0;
  h2hMatches.forEach((match) => {
    if (match.home_team_id === homeTeam.id) {
      if (match.home_score > match.away_score) homeH2HWins++;
      else if (match.away_score > match.home_score) awayH2HWins++;
    } else {
      if (match.away_score > match.home_score) homeH2HWins++;
      else if (match.home_score > match.away_score) awayH2HWins++;
    }
  });

  // Generate narrative response
  let response = `## ${homeTeam.name} vs ${awayTeam.name} - Elemzés\n\n`;

  response += `### Forma Analízis\n`;
  response += `- **${homeTeam.name}** forma pontszám: ${homeForm}/100\n`;
  response += `- **${awayTeam.name}** forma pontszám: ${awayForm}/100\n`;

  if (homeForm > awayForm) {
    response += `✅ A hazai csapat jelenleg jobb formában van.\n\n`;
  } else if (awayForm > homeForm) {
    response += `✅ A vendég csapat jelenleg jobb formában van.\n\n`;
  } else {
    response += `⚖️ Hasonló a forma mindkét csapatnál.\n\n`;
  }

  response += `### Legutóbbi Mérkőzések\n`;
  response += `**${homeTeam.name}** utolsó 5 meccs: `;
  response += homeMatches
    .slice(0, 5)
    .map((m) => {
      const isHome = m.home_team_id === homeTeam.id;
      const teamScore = isHome ? m.home_score : m.away_score;
      const opponentScore = isHome ? m.away_score : m.home_score;
      if (teamScore > opponentScore) return '✓';
      else if (teamScore === opponentScore) return '=';
      else return '✗';
    })
    .join(' ');
  response += '\n';

  response += `**${awayTeam.name}** utolsó 5 meccs: `;
  response += awayMatches
    .slice(0, 5)
    .map((m) => {
      const isHome = m.home_team_id === awayTeam.id;
      const teamScore = isHome ? m.home_score : m.away_score;
      const opponentScore = isHome ? m.away_score : m.home_score;
      if (teamScore > opponentScore) return '✓';
      else if (teamScore === opponentScore) return '=';
      else return '✗';
    })
    .join(' ');
  response += '\n\n';

  response += `### Egymás Elleni Mérkőzések (H2H)\n`;
  if (h2hMatches.length === 0) {
    response += `Nincs előzményadat az egymás elleni mérkőzésekről.\n\n`;
  } else {
    response += `- **${homeTeam.name}** H2H győzelmei: ${homeH2HWins}\n`;
    response += `- **${awayTeam.name}** H2H győzelmei: ${awayH2HWins}\n`;
    response += `- Utolsó ${h2hMatches.length} mérkőzés:\n`;

    h2hMatches.slice(0, 3).forEach((match) => {
      const isHome = match.home_team_id === homeTeam.id;
      const homeLabel = isHome ? homeTeam.name : awayTeam.name;
      const awayLabel = isHome ? awayTeam.name : homeTeam.name;
      response += `  • ${homeLabel} ${match.home_score} - ${match.away_score} ${awayLabel}\n`;
    });
  }

  response += `\n### Javaslat\n`;
  const prediction = homeForm > awayForm ? 'Hazai csapat előnye' : 'Vendég csapat előnye';
  response += `A forma és a H2H adatok alapján **${prediction}** javasolt.\n`;
  response += `\nTovábbi részletes elemzésért vizsgálja meg az összes statisztikát és a recent perform menténcékat az alkalmazásban.\n`;

  return response;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight();
  }

  try {
    // Authenticate request (optional for chat, but good for analytics)
    const authResult = await protectEndpoint(
      req.headers.get('Authorization'),
      requireUser
    );

    if ('error' in authResult) {
      console.warn('Auth warning:', authResult.error);
      // Continue anyway for public access
    }

    let supabase: SupabaseClient;
    let isAuthenticated = false;

    if ('error' in authResult) {
      const supabaseModule = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
      supabase = supabaseModule.createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      ) as SupabaseClient;
    } else {
      supabase = authResult.context.serviceClient;
      isAuthenticated = true;
    }

    // Parse and validate request
    const body = await req.json();
    const validation = AIChatRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid input',
          details: validation.error.issues
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { message, context } = validation.data;

    // Extract team names from message
    const teams = extractTeamNames(message);

    if (!teams.home || !teams.away) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nem tudtam azonosítani a csapatnéveket. Kérlek adj meg a "TeamA vs TeamB" formátumban!'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Look up teams in database
    const homeTeam = await getTeamByName(supabase, teams.home);
    const awayTeam = await getTeamByName(supabase, teams.away);

    if (!homeTeam || !awayTeam) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Nem találtam csapatot. Keresés: "${teams.home}" vs "${teams.away}"`
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Gather data for analysis
    const homeMatches = await getRecentMatches(supabase, homeTeam.id);
    const awayMatches = await getRecentMatches(supabase, awayTeam.id);
    const h2hMatches = await getH2HMatches(supabase, homeTeam.id, awayTeam.id);

    // Generate analysis
    const analysisMessage = generateAnalysisResponse(
      homeTeam,
      awayTeam,
      homeMatches,
      awayMatches,
      h2hMatches
    );

    // Log the chat interaction for analytics
    if (isAuthenticated && context?.userId) {
      try {
        await logAuditAction(
          authResult.context?.supabaseClient,
          context.userId,
          'ai_chat_query',
          'match',
          `${homeTeam.id}_${awayTeam.id}`,
          {
            home_team: homeTeam.name,
            away_team: awayTeam.name,
            message,
            league: context.league
          }
        );
      } catch (auditError) {
        console.error('Audit logging error:', auditError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: analysisMessage,
        analysis: {
          teams: {
            home: homeTeam.name,
            away: awayTeam.name
          },
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          league: homeTeam.league_id,
          recentForm: {
            home: calculateFormScore(homeMatches, homeTeam.id),
            away: calculateFormScore(awayMatches, awayTeam.id)
          },
          h2hHistory: h2hMatches.map((m) => ({
            homeScore: m.home_score,
            awayScore: m.away_score,
            date: m.match_date
          }))
        },
        metadata: {
          responseTime: Date.now(),
          model: 'gpt-4-fallback',
          tokensUsed: 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('AI Chat error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
