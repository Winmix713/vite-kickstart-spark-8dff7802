// Phase 9: Temporal Decay Edge Functions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/zod.ts'
import type {
  SupabaseClient,
  FreshnessRecord,
  CreateFreshnessResult,
  RefreshResult,
  RefreshResultDetail,
  DataTypeConfig,
  TrackedTableName,
  DataType,
} from './types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validation schemas
const freshnessCalculationSchema = z.object({
  table_name: z.string().min(1),
  record_id: z.string().min(1),
  decay_rate: z.number().min(0).max(1).optional()
})

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
    ) as unknown as SupabaseClient

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/')

    // Route handling
    if (pathSegments[3] === 'temporal') {
      if (pathSegments[4] === 'freshness' && req.method === 'POST') {
        return await handleCalculateFreshness(req, supabase)
      }
      if (pathSegments[4] === 'check-stale' && req.method === 'POST') {
        return await handleCheckStaleData(req, supabase)
      }
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    )
  } catch (error) {
    console.error('Error in temporal-decay function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Handle freshness score calculation
async function handleCalculateFreshness(req: Request, supabase: SupabaseClient): Promise<Response> {
  try {
    const body = await req.json()
    const validatedData = freshnessCalculationSchema.parse(body)

    // Get or create freshness record
    const { data: existingRecord, error: fetchError } = await supabase
      .from<FreshnessRecord>('information_freshness')
      .select('*')
      .eq('table_name', validatedData.table_name)
      .eq('record_id', validatedData.record_id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      throw fetchError
    }

    let freshnessRecord: FreshnessRecord
    if (existingRecord) {
      freshnessRecord = existingRecord
    } else {
      // Create new freshness record
      const newRecord = await createFreshnessRecord(
        validatedData.table_name,
        validatedData.record_id,
        validatedData.decay_rate,
        supabase
      )
      if (!newRecord.success || !newRecord.record) {
        throw new Error(newRecord.error || 'Failed to create freshness record')
      }
      freshnessRecord = newRecord.record
    }

    // Calculate current freshness score using database function
    const { data: scoreData, error: scoreError } = await supabase.rpc<number>('calculate_freshness_score', {
      last_updated: freshnessRecord.last_updated,
      decay_rate: freshnessRecord.decay_rate
    })

    if (scoreError) throw scoreError

    const freshnessScore = scoreData ?? 0
    const isStale = freshnessScore < 0.5 // Consider stale if freshness < 50%

    // Update the freshness record
    const { error: updateError } = await supabase
      .from<FreshnessRecord>('information_freshness')
      .update({
        freshness_score: freshnessScore,
        is_stale: isStale
      })
      .eq('id', freshnessRecord.id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ 
        success: true, 
        freshness_score: freshnessScore,
        is_stale: isStale
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

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

// Handle stale data checking and refresh
async function handleCheckStaleData(req: Request, supabase: SupabaseClient): Promise<Response> {
  try {
    // Get all stale records
    const { data: staleRecords, error: fetchError } = await supabase
      .from<FreshnessRecord>('information_freshness')
      .select('*')
      .eq('is_stale', true)

    if (fetchError) throw fetchError

    let refreshedCount = 0
    const refreshResults: RefreshResultDetail[] = []
    const records = staleRecords ?? []

    // Refresh each stale record
    for (const record of records) {
      const refreshResult = await refreshStaleRecord(record, supabase)
      refreshResults.push({
        recordId: record.id,
        tableName: record.table_name,
        success: refreshResult.success,
        error: refreshResult.error
      })

      if (refreshResult.success) {
        refreshedCount++
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        staleRecords: records,
        refreshedCount,
        refreshResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

// Create a new freshness record
async function createFreshnessRecord(
  tableName: string,
  recordId: string,
  decayRate: number | undefined,
  supabase: SupabaseClient
): Promise<CreateFreshnessResult> {
  try {
    // Determine data type and default decay rate
    const config = getDataTypeConfig(tableName)

    const { data, error } = await supabase
      .from<FreshnessRecord>('information_freshness')
      .insert({
        table_name: tableName,
        record_id: recordId,
        data_type: config.dataType,
        last_updated: new Date().toISOString(),
        decay_rate: decayRate ?? config.defaultDecayRate,
        freshness_score: 1.0,
        is_stale: false,
        stale_threshold_days: config.staleThresholdDays
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      record: data ?? undefined
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: errorMessage
    }
  }
}

// Helper function to get data type configuration
function getDataTypeConfig(tableName: string): DataTypeConfig {
  const tableNameLower = tableName.toLowerCase()
  
  switch (tableNameLower) {
    case 'matches':
      return {
        dataType: 'match',
        defaultDecayRate: 0.05,
        staleThresholdDays: 3
      }
    case 'predictions':
      return {
        dataType: 'user_prediction',
        defaultDecayRate: 0.1,
        staleThresholdDays: 7
      }
    case 'market_odds':
      return {
        dataType: 'odds',
        defaultDecayRate: 0.5,
        staleThresholdDays: 1
      }
    default:
      return {
        dataType: 'pattern',
        defaultDecayRate: 0.15,
        staleThresholdDays: 5
      }
  }
}

// Refresh a stale record
async function refreshStaleRecord(
  record: FreshnessRecord,
  supabase: SupabaseClient
): Promise<RefreshResult> {
  try {
    // In a real implementation, this would trigger data refresh based on the table type
    // For now, we'll just update the last_updated timestamp
    
    const { error } = await supabase
      .from<FreshnessRecord>('information_freshness')
      .update({
        last_updated: new Date().toISOString(),
        freshness_score: 1.0,
        is_stale: false
      })
      .eq('id', record.id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      error: errorMessage
    }
  }
}