// Phase 9: Collaborative Intelligence Edge Functions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/zod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validation schemas
const userPredictionSchema = z.object({
  match_id: z.string().uuid(),
  user_id: z.string().min(1),
  predicted_outcome: z.enum(['home_win', 'draw', 'away_win']),
  confidence_score: z.number().min(0).max(100),
  predicted_home_score: z.number().min(0).max(10).optional(),
  predicted_away_score: z.number().min(0).max(10).optional(),
  btts_prediction: z.boolean().optional(),
  over_under_prediction: z.enum(['over_2.5', 'under_2.5']).optional(),
  reasoning: z.string().max(500).optional()
})

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Check Phase 9 feature flag
  const phase9Enabled = Deno.env.get('PHASE9_ENABLED') === 'true';
  if (!phase9Enabled) {
    return new Response(
      JSON.stringify({ 
        error: 'Feature disabled',
        message: 'Phase 9 collaborative intelligence is currently disabled'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
    )
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
    if (pathSegments[3] === 'predictions') {
      if (pathSegments[4] === 'user' && req.method === 'POST') {
        return await handleUserPrediction(req, supabase)
      }
      if (pathSegments[4] === 'crowd' && pathSegments[5] && req.method === 'GET') {
        return await handleGetCrowdWisdom(pathSegments[5], supabase)
      }
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    )
  } catch (error) {
    console.error('Error in collaborative-intelligence function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Handle user prediction submission
async function handleUserPrediction(req: Request, supabase: { from(table: string): unknown }) {
  try {
    const body = await req.json()
    const validatedData = userPredictionSchema.parse(body)

    // Insert user prediction
    const { data: prediction, error: insertError } = await supabase
      .from('user_predictions')
      .insert(validatedData)
      .select()
      .single()

    if (insertError) throw insertError

    // Update crowd wisdom aggregation
    const { error: updateError } = await supabase.rpc('update_crowd_wisdom', {
      p_match_id: validatedData.match_id
    })

    if (updateError) {
      console.error('Error updating crowd wisdom:', updateError)
      // Don't fail the request if crowd wisdom update fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        prediction 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Validation failed', 
          details: error.errors 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
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

// Handle crowd wisdom retrieval
async function handleGetCrowdWisdom(matchId: string, supabase: { from(table: string): unknown }) {
  try {
    const { data, error } = await supabase
      .from('crowd_wisdom')
      .select('*')
      .eq('match_id', matchId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        crowdWisdom: data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}