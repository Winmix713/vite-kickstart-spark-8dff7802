import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { logger } from '../_shared/logger.ts'
import { APIKeyManager } from '../_shared/api-key-manager.ts'
import { RateLimiter } from '../_shared/rate-limiter.ts'
import { RequestValidator } from '../_shared/request-validator.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize services
const apiKeyManager = new APIKeyManager(supabase)
const rateLimiter = new RateLimiter()
const validator = new RequestValidator()

// API Endpoints
const API_ENDPOINTS = {
  // Predictions
  predictions: '/v1/predictions',
  predictionsByMatch: '/v1/predictions/match/:matchId',
  predictionsByTeam: '/v1/predictions/team/:teamId',
  predictionsByLeague: '/v1/predictions/league/:leagueId',
  
  // Matches
  matches: '/v1/matches',
  matchById: '/v1/matches/:matchId',
  matchesByDate: '/v1/matches/date/:date',
  matchesByLeague: '/v1/matches/league/:leagueId',
  
  // Teams
  teams: '/v1/teams',
  teamById: '/v1/teams/:teamId',
  teamStats: '/v1/teams/:teamId/stats',
  
  // Leagues
  leagues: '/v1/leagues',
  leagueById: '/v1/leagues/:leagueId',
  leagueStandings: '/v1/leagues/:leagueId/standings',
  
  // Analytics
  analyticsPerformance: '/v1/analytics/performance',
  analyticsAccuracy: '/v1/analytics/accuracy',
  analyticsTrends: '/v1/analytics/trends',
  
  // Market Data
  marketOdds: '/v1/market/odds',
  marketValueBets: '/v1/market/value-bets',
  marketCorrelations: '/v1/market/correlations',
  
  // Models
  models: '/v1/models',
  modelById: '/v1/models/:modelId',
  modelPerformance: '/v1/models/:modelId/performance',
  
  // Jobs
  jobs: '/v1/jobs',
  jobById: '/v1/jobs/:jobId',
  jobLogs: '/v1/jobs/:jobId/logs',
} as const

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  try {
    // Log incoming request
    logger.info('API Request', {
      method,
      path,
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
    })

    // API Key Authentication
    const apiKey = req.headers.get('authorization')?.replace('Bearer ', '') || 
                   req.headers.get('x-api-key')

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate API key
    const keyValidation = await apiKeyManager.validateKey(apiKey)
    if (!keyValidation.valid) {
      return new Response(
        JSON.stringify({ error: keyValidation.error || 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting
    const rateLimitResult = await rateLimiter.checkLimit(apiKey, path)
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime,
          limit: rateLimitResult.limit
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      )
    }

    // Route request
    const response = await routeRequest(req, path, method, url, keyValidation)

    // Log successful response
    const duration = Date.now() - startTime
    logger.info('API Response', {
      method,
      path,
      status: response.status,
      duration,
      apiKey: apiKey.substring(0, 8) + '...'
    })

    return response

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('API Error', error, {
      method,
      path,
      duration,
      apiKey: apiKey?.substring(0, 8) + '...'
    })

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        requestId: crypto.randomUUID()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

async function routeRequest(
  req: Request,
  path: string,
  method: string,
  url: URL,
  keyValidation: any
): Promise<Response> {
  const pathParts = path.split('/').filter(Boolean)
  
  // Predictions endpoints
  if (path.startsWith('/v1/predictions')) {
    return handlePredictions(req, pathParts, method, url, keyValidation)
  }
  
  // Matches endpoints
  if (path.startsWith('/v1/matches')) {
    return handleMatches(req, pathParts, method, url, keyValidation)
  }
  
  // Teams endpoints
  if (path.startsWith('/v1/teams')) {
    return handleTeams(req, pathParts, method, url, keyValidation)
  }
  
  // Leagues endpoints
  if (path.startsWith('/v1/leagues')) {
    return handleLeagues(req, pathParts, method, url, keyValidation)
  }
  
  // Analytics endpoints
  if (path.startsWith('/v1/analytics')) {
    return handleAnalytics(req, pathParts, method, url, keyValidation)
  }
  
  // Market data endpoints
  if (path.startsWith('/v1/market')) {
    return handleMarket(req, pathParts, method, url, keyValidation)
  }
  
  // Models endpoints
  if (path.startsWith('/v1/models')) {
    return handleModels(req, pathParts, method, url, keyValidation)
  }
  
  // Jobs endpoints
  if (path.startsWith('/v1/jobs')) {
    return handleJobs(req, pathParts, method, url, keyValidation)
  }

  // API Info endpoint
  if (path === '/v1' || path === '/v1/info') {
    return handleAPIInfo(keyValidation)
  }

  return new Response(
    JSON.stringify({ error: 'Endpoint not found' }),
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Predictions handlers
async function handlePredictions(
  req: Request,
  pathParts: string[],
  method: string,
  url: URL,
  keyValidation: any
): Promise<Response> {
  const { data: predictions, error } = await supabase
    .from('predictions')
    .select(`
      *,
      matches!inner(
        id,
        home_team,
        away_team,
        league_id,
        match_date,
        status
      ),
      models!inner(
        id,
        name,
        version,
        type
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  // Filter based on query parameters
  let filteredPredictions = predictions || []
  
  if (url.searchParams.has('match_id')) {
    const matchId = url.searchParams.get('match_id')
    filteredPredictions = filteredPredictions.filter(p => p.match_id === matchId)
  }
  
  if (url.searchParams.has('team_id')) {
    const teamId = url.searchParams.get('team_id')
    filteredPredictions = filteredPredictions.filter(p => 
      p.matches.home_team === teamId || p.matches.away_team === teamId
    )
  }
  
  if (url.searchParams.has('league_id')) {
    const leagueId = url.searchParams.get('league_id')
    filteredPredictions = filteredPredictions.filter(p => p.matches.league_id === leagueId)
  }

  // Pagination
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const paginatedPredictions = filteredPredictions.slice(offset, offset + limit)

  return new Response(
    JSON.stringify({
      data: paginatedPredictions,
      pagination: {
        total: filteredPredictions.length,
        limit,
        offset,
        hasMore: offset + limit < filteredPredictions.length
      }
    }),
    { 
      status: 200, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Total-Count': filteredPredictions.length.toString()
      } 
    }
  )
}

// Matches handlers
async function handleMatches(
  req: Request,
  pathParts: string[],
  method: string,
  url: URL,
  keyValidation: any
): Promise<Response> {
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      *,
      leagues!inner(
        id,
        name,
        country
      )
    `)
    .order('match_date', { ascending: false })

  if (error) {
    throw error
  }

  // Filter based on query parameters
  let filteredMatches = matches || []
  
  if (url.searchParams.has('league_id')) {
    const leagueId = url.searchParams.get('league_id')
    filteredMatches = filteredMatches.filter(m => m.league_id === leagueId)
  }
  
  if (url.searchParams.has('status')) {
    const status = url.searchParams.get('status')
    filteredMatches = filteredMatches.filter(m => m.status === status)
  }
  
  if (url.searchParams.has('date_from')) {
    const dateFrom = url.searchParams.get('date_from')
    filteredMatches = filteredMatches.filter(m => m.match_date >= dateFrom)
  }
  
  if (url.searchParams.has('date_to')) {
    const dateTo = url.searchParams.get('date_to')
    filteredMatches = filteredMatches.filter(m => m.match_date <= dateTo)
  }

  // Pagination
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const paginatedMatches = filteredMatches.slice(offset, offset + limit)

  return new Response(
    JSON.stringify({
      data: paginatedMatches,
      pagination: {
        total: filteredMatches.length,
        limit,
        offset,
        hasMore: offset + limit < filteredMatches.length
      }
    }),
    { 
      status: 200, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Total-Count': filteredMatches.length.toString()
      } 
    }
  )
}

// Teams handlers
async function handleTeams(
  req: Request,
  pathParts: string[],
  method: string,
  url: URL,
  keyValidation: any
): Promise<Response> {
  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
    .order('name')

  if (error) {
    throw error
  }

  return new Response(
    JSON.stringify({
      data: teams || [],
      pagination: {
        total: teams?.length || 0,
        limit: teams?.length || 0,
        offset: 0,
        hasMore: false
      }
    }),
    { 
      status: 200, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Total-Count': (teams?.length || 0).toString()
      } 
    }
  )
}

// Leagues handlers
async function handleLeagues(
  req: Request,
  pathParts: string[],
  method: string,
  url: URL,
  keyValidation: any
): Promise<Response> {
  const { data: leagues, error } = await supabase
    .from('leagues')
    .select('*')
    .order('name')

  if (error) {
    throw error
  }

  return new Response(
    JSON.stringify({
      data: leagues || [],
      pagination: {
        total: leagues?.length || 0,
        limit: leagues?.length || 0,
        offset: 0,
        hasMore: false
      }
    }),
    { 
      status: 200, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Total-Count': (leagues?.length || 0).toString()
      } 
    }
  )
}

// Analytics handlers
async function handleAnalytics(
  req: Request,
  pathParts: string[],
  method: string,
  url: URL,
  keyValidation: any
): Promise<Response> {
  if (pathParts[2] === 'performance') {
    // Get model performance analytics
    const { data, error } = await supabase
      .from('model_evaluations')
      .select(`
        *,
        models!inner(
          id,
          name,
          version
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ data: data || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (pathParts[2] === 'accuracy') {
    // Get prediction accuracy analytics
    const { data, error } = await supabase
      .from('prediction_evaluations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ data: data || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Analytics endpoint not found' }),
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Market data handlers
async function handleMarket(
  req: Request,
  pathParts: string[],
  method: string,
  url: URL,
  keyValidation: any
): Promise<Response> {
  if (pathParts[2] === 'odds') {
    const { data: odds, error } = await supabase
      .from('market_odds')
      .select(`
        *,
        matches!inner(
          id,
          home_team,
          away_team,
          league_id,
          match_date
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ data: odds || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (pathParts[2] === 'value-bets') {
    // Get value bet opportunities
    const { data, error } = await supabase
      .from('value_bet_opportunities')
      .select(`
        *,
        matches!inner(
          id,
          home_team,
          away_team,
          match_date
        )
      `)
      .eq('is_active', true)
      .order('expected_value', { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ data: data || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Market endpoint not found' }),
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Models handlers
async function handleModels(
  req: Request,
  pathParts: string[],
  method: string,
  url: URL,
  keyValidation: any
): Promise<Response> {
  const { data: models, error } = await supabase
    .from('models')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return new Response(
    JSON.stringify({
      data: models || [],
      pagination: {
        total: models?.length || 0,
        limit: models?.length || 0,
        offset: 0,
        hasMore: false
      }
    }),
    { 
      status: 200, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Total-Count': (models?.length || 0).toString()
      } 
    }
  )
}

// Jobs handlers
async function handleJobs(
  req: Request,
  pathParts: string[],
  method: string,
  url: URL,
  keyValidation: any
): Promise<Response> {
  const { data: jobs, error } = await supabase
    .from('scheduled_jobs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return new Response(
    JSON.stringify({
      data: jobs || [],
      pagination: {
        total: jobs?.length || 0,
        limit: jobs?.length || 0,
        offset: 0,
        hasMore: false
      }
    }),
    { 
      status: 200, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Total-Count': (jobs?.length || 0).toString()
      } 
    }
  )
}

// API Info handler
async function handleAPIInfo(keyValidation: any): Promise<Response> {
  const info = {
    name: 'WinMix TipsterHub API',
    version: '1.0.0',
    description: 'Public API for football predictions and analytics',
    endpoints: Object.values(API_ENDPOINTS),
    authentication: 'API Key required',
    rateLimit: {
      requests: keyValidation.tier?.rate_limit || 1000,
      window: '1 hour'
    },
    documentation: 'https://docs.winmix.com/api',
    support: 'api-support@winmix.com',
    timestamp: new Date().toISOString()
  }

  return new Response(
    JSON.stringify(info),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}