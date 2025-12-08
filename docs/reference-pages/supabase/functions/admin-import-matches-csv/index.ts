import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface CSVImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

interface MatchData {
  league_name?: string;
  home_team?: string;
  away_team?: string;
  match_date?: string;
  venue?: string;
  status?: string;
  home_score?: string;
  away_score?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Check if user is admin or analyst
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'analyst'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Admin or analyst access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { content } = await req.json()

    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid CSV content provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result: CSVImportResult = {
      total: 0,
      imported: 0,
      skipped: 0,
      errors: []
    }

    // Parse CSV content
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ error: 'CSV must contain header and at least one data row' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse header
    const header = lines[0].split(',').map(col => col.trim().toLowerCase())
    const expectedHeaders = ['league', 'home team', 'away team', 'match date']
    
    // Check if required headers are present
    const hasRequiredHeaders = expectedHeaders.every(h => 
      header.some(col => col.includes(h.toLowerCase()))
    )
    
    if (!hasRequiredHeaders) {
      return new Response(
        JSON.stringify({ error: 'CSV must contain columns for League, Home Team, Away Team, and Match Date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all leagues for mapping
    const { data: leagues } = await supabaseClient
      .from('leagues')
      .select('id, name, country')

    const leagueMap = new Map()
    leagues?.forEach(league => {
      leagueMap.set(league.name.toLowerCase(), league.id)
    })

    // Get all teams for mapping
    const { data: teams } = await supabaseClient
      .from('teams')
      .select('id, name')

    const teamMap = new Map()
    teams?.forEach(team => {
      teamMap.set(team.name.toLowerCase(), team.id)
    })

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      result.total++
      
      try {
        const values = line.split(',').map(val => val.trim().replace(/^["']|["']$/g, ''))
        const rowData: MatchData = {}
        
        // Map values to headers
        header.forEach((col, index) => {
          const value = values[index] || ''
          
          if (col.includes('league')) rowData.league_name = value
          else if (col.includes('home team')) rowData.home_team = value
          else if (col.includes('away team')) rowData.away_team = value
          else if (col.includes('match date') || col.includes('date')) rowData.match_date = value
          else if (col.includes('venue')) rowData.venue = value
          else if (col.includes('status')) rowData.status = value
          else if (col.includes('home score')) rowData.home_score = value
          else if (col.includes('away score')) rowData.away_score = value
        })

        // Validate required fields
        if (!rowData.league_name || !rowData.home_team || !rowData.away_team || !rowData.match_date) {
          result.errors.push({
            row: i + 1,
            error: 'Missing required fields (League, Home Team, Away Team, Match Date)'
          })
          continue
        }

        // Find league ID
        const leagueId = leagueMap.get(rowData.league_name.toLowerCase())
        if (!leagueId) {
          result.errors.push({
            row: i + 1,
            error: `League not found: ${rowData.league_name}`
          })
          continue
        }

        // Find team IDs
        const homeTeamId = teamMap.get(rowData.home_team.toLowerCase())
        const awayTeamId = teamMap.get(rowData.away_team.toLowerCase())
        
        if (!homeTeamId) {
          result.errors.push({
            row: i + 1,
            error: `Home team not found: ${rowData.home_team}`
          })
          continue
        }

        if (!awayTeamId) {
          result.errors.push({
            row: i + 1,
            error: `Away team not found: ${rowData.away_team}`
          })
          continue
        }

        // Parse and validate date
        let matchDate = rowData.match_date
        try {
          // Try to parse various date formats
          const date = new Date(rowData.match_date)
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date')
          }
          matchDate = date.toISOString()
        } catch (error) {
          result.errors.push({
            row: i + 1,
            error: `Invalid date format: ${rowData.match_date}`
          })
          continue
        }

        // Check if match already exists
        const { data: existingMatch } = await supabaseClient
          .from('matches')
          .select('id')
          .eq('league_id', leagueId)
          .eq('home_team_id', homeTeamId)
          .eq('away_team_id', awayTeamId)
          .eq('match_date', matchDate)
          .single()

        if (existingMatch) {
          result.skipped++
          continue
        }

        // Insert match
        const matchData: Record<string, unknown> = {
          league_id: leagueId,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          match_date: matchDate,
          status: rowData.status?.toLowerCase() || 'scheduled'
        }

        if (rowData.venue) matchData.venue = rowData.venue
        if (rowData.home_score && rowData.away_score) {
          matchData.home_score = parseInt(rowData.home_score)
          matchData.away_score = parseInt(rowData.away_score)
        }

        const { error } = await supabaseClient
          .from('matches')
          .insert(matchData)

        if (error) {
          result.errors.push({
            row: i + 1,
            error: `Database error: ${error.message}`
          })
        } else {
          result.imported++
        }

      } catch (error) {
        result.errors.push({
          row: i + 1,
          error: `Processing error: ${error.message}`
        })
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in admin-import-matches-csv function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})