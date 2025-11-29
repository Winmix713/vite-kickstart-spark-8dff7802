// Phase 9: Market Integration Edge Functions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Odds API configuration
const ODDS_API_CONFIG = {
  baseUrl: 'https://api.the-odds-api.com/v4',
  apiKey: Deno.env.get('ODDS_API_KEY') || '',
  rateLimitPerHour: 500,
  retryAttempts: 3,
  retryDelay: 1000 // ms
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/')

    // Route handling
    if (pathSegments[3] === 'market') {
      if (pathSegments[4] === 'odds' && pathSegments[5] && req.method === 'GET') {
        return await handleGetOdds(pathSegments[5], supabase)
      }
      if (pathSegments[4] === 'value-bets' && req.method === 'GET') {
        return await handleGetValueBets(req, supabase)
      }
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    )
  } catch (error) {
    console.error('Error in market-integration function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Handle odds fetching with external API integration
async function handleGetOdds(matchId: string, supabase: { from(table: string): unknown }) {
  try {
    // Check if we have recent odds (cache for 5 minutes)
    const { data: cachedOdds, error: cacheError } = await supabase
      .from('market_odds')
      .select('*')
      .eq('match_id', matchId)
      .gte('last_updated', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('last_updated', { ascending: false })

    if (cacheError) throw cacheError

    // If we have recent cached odds, return them
    if (cachedOdds && cachedOdds.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          odds: cachedOdds,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch fresh odds from external API
    const freshOdds = await fetchExternalOdds(matchId)
    
    if (!freshOdds.success) {
      throw new Error(freshOdds.error)
    }

    // Store fresh odds in database
    const storedOdds = await storeMarketOdds(matchId, freshOdds.data!, supabase)

    return new Response(
      JSON.stringify({ 
        success: true, 
        odds: storedOdds,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching odds:', error)
    
    // Try to return stale odds as fallback
    try {
      const { data: staleOdds } = await supabase
        .from('market_odds')
        .select('*')
        .eq('match_id', matchId)
        .order('last_updated', { ascending: false })

      if (staleOdds && staleOdds.length > 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            odds: staleOdds,
            cached: true,
            stale: true,
            warning: 'Showing stale data due to API error'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

// Handle value bets calculation
async function handleGetValueBets(req: Request, supabase: { from(table: string): unknown }) {
  try {
    const url = new URL(req.url)
    const maxResults = parseInt(url.searchParams.get('maxResults') || '50')
    const minExpectedValue = parseFloat(url.searchParams.get('minExpectedValue') || '0.05')

    // Get model predictions
    const { data: predictions, error: predictionError } = await supabase
      .from('predictions')
      .select('*')
      .eq('evaluated_at', null) // Only future/pending predictions
      .limit(100)

    if (predictionError) throw predictionError

    if (!predictions || predictions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          valueBets: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const valueBets = []

    // Process each prediction
    for (const prediction of predictions) {
      // Get market odds for this match
      const { data: odds, error: oddsError } = await supabase
        .from('market_odds')
        .select('*')
        .eq('match_id', prediction.match_id)
        .order('last_updated', { ascending: false })

      if (oddsError) continue
      if (!odds || odds.length === 0) continue

      // Calculate value bets for each bookmaker
      for (const odd of odds) {
        const modelProb = prediction.confidence_score / 100
        
        // Calculate expected value for each outcome
        const outcomes = [
          { type: 'home_win', odds: odd.home_win_odds, modelProb: getOutcomeProbability(prediction, 'home_win') },
          { type: 'draw', odds: odd.draw_odds, modelProb: getOutcomeProbability(prediction, 'draw') },
          { type: 'away_win', odds: odd.away_win_odds, modelProb: getOutcomeProbability(prediction, 'away_win') }
        ]

        for (const outcome of outcomes) {
          const ev = calculateExpectedValue(outcome.odds, outcome.modelProb)
          const kelly = calculateKellyFraction(outcome.odds, outcome.modelProb)

          if (ev > minExpectedValue) { // Only consider positive EV bets above threshold
            const confidenceLevel = getConfidenceLevel(ev, kelly)

            const valueBet = {
              id: '', // Will be set by database
              match_id: prediction.match_id,
              bookmaker: odd.bookmaker,
              bet_type: outcome.type,
              bookmaker_odds: outcome.odds,
              model_probability: outcome.modelProb,
              implied_probability: 1 / outcome.odds,
              expected_value: ev,
              kelly_fraction: kelly,
              confidence_level: confidenceLevel,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            valueBets.push(valueBet)
          }
        }
      }
    }

    // Sort by expected value and limit results
    valueBets.sort((a, b) => b.expected_value - a.expected_value)
    const limitedValueBets = valueBets.slice(0, maxResults)

    // Store value bets in database (upsert to avoid duplicates)
    if (limitedValueBets.length > 0) {
      const { data: storedBets, error: storeError } = await supabase
        .from('value_bets')
        .upsert(limitedValueBets, { 
          onConflict: 'match_id,bookmaker,bet_type',
          ignoreDuplicates: false 
        })
        .select()

      if (storeError) throw storeError

      return new Response(
        JSON.stringify({ 
          success: true, 
          valueBets: storedBets 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        valueBets: [] 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error calculating value bets:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

// Fetch odds from external API with retry logic
async function fetchExternalOdds(matchId: string, attempt: number = 0): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    if (!ODDS_API_CONFIG.apiKey) {
      throw new Error('Odds API key not configured')
    }

    // In a real implementation, you would map matchId to the format expected by the odds API
    // For now, we'll simulate the API call with mock data
    const mockOddsData = generateMockOddsData(matchId)
    
    return {
      success: true,
      data: mockOddsData
    }
  } catch (error) {
    if (attempt < ODDS_API_CONFIG.retryAttempts) {
      console.log(`Retrying odds fetch (attempt ${attempt + 1}/${ODDS_API_CONFIG.retryAttempts})`)
      await new Promise(resolve => setTimeout(resolve, ODDS_API_CONFIG.retryDelay * Math.pow(2, attempt)))
      return fetchExternalOdds(matchId, attempt + 1)
    }

    return {
      success: false,
      error: `Failed after ${ODDS_API_CONFIG.retryAttempts} attempts: ${error.message}`
    }
  }
}

// Generate mock odds data (replace with real API call)
function generateMockOddsData(matchId: string) {
  return [
    {
      bookmaker: 'Bet365',
      home_win_odds: 2.10 + Math.random() * 0.4,
      draw_odds: 3.20 + Math.random() * 0.4,
      away_win_odds: 3.40 + Math.random() * 0.4,
      over_2_5_odds: 1.80 + Math.random() * 0.2,
      under_2_5_odds: 2.00 + Math.random() * 0.2,
      btts_yes_odds: 1.70 + Math.random() * 0.2,
      btts_no_odds: 2.10 + Math.random() * 0.2
    },
    {
      bookmaker: 'William Hill',
      home_win_odds: 2.05 + Math.random() * 0.4,
      draw_odds: 3.30 + Math.random() * 0.4,
      away_win_odds: 3.50 + Math.random() * 0.4,
      over_2_5_odds: 1.85 + Math.random() * 0.2,
      under_2_5_odds: 1.95 + Math.random() * 0.2,
      btts_yes_odds: 1.75 + Math.random() * 0.2,
      btts_no_odds: 2.05 + Math.random() * 0.2
    },
    {
      bookmaker: 'Betfair',
      home_win_odds: 2.15 + Math.random() * 0.4,
      draw_odds: 3.25 + Math.random() * 0.4,
      away_win_odds: 3.35 + Math.random() * 0.4,
      over_2_5_odds: 1.82 + Math.random() * 0.2,
      under_2_5_odds: 1.98 + Math.random() * 0.2,
      btts_yes_odds: 1.72 + Math.random() * 0.2,
      btts_no_odds: 2.08 + Math.random() * 0.2
    }
  ]
}

// Store market odds in database
async function storeMarketOdds(matchId: string, oddsData: Record<string, unknown>[], supabase: { from(table: string): unknown }) {
  const storedOdds = []

  for (const odds of oddsData) {
    const { data, error } = await supabase
      .from('market_odds')
      .upsert({
        match_id: matchId,
        bookmaker: odds.bookmaker,
        home_win_odds: odds.home_win_odds,
        draw_odds: odds.draw_odds,
        away_win_odds: odds.away_win_odds,
        over_2_5_odds: odds.over_2_5_odds,
        under_2_5_odds: odds.under_2_5_odds,
        btts_yes_odds: odds.btts_yes_odds,
        btts_no_odds: odds.btts_no_odds,
        last_updated: new Date().toISOString(),
        api_source: 'odds-api',
        raw_response: odds
      }, { onConflict: 'match_id,bookmaker' })
      .select()
      .single()

    if (error) throw error
    storedOdds.push(data)
  }

  return storedOdds
}

// Helper functions for calculations
function getOutcomeProbability(prediction: { confidence_score: number; predicted_outcome: string }, outcome: string): number {
  const baseProb = prediction.confidence_score / 100
  
  if (prediction.predicted_outcome === outcome) {
    return baseProb
  } else {
    // Distribute remaining probability among other outcomes
    return (1 - baseProb) / 2
  }
}

function calculateExpectedValue(odds: number, modelProbability: number): number {
  return (modelProbability * odds) - 1
}

function calculateKellyFraction(odds: number, modelProbability: number): number {
  const edge = (modelProbability * odds) - 1
  return Math.max(0, Math.min(1, edge / (odds - 1)))
}

function getConfidenceLevel(ev: number, kelly: number): 'low' | 'medium' | 'high' {
  if (ev > 0.15 && kelly > 0.1) return 'high'
  if (ev > 0.08 && kelly > 0.05) return 'medium'
  return 'low'
}