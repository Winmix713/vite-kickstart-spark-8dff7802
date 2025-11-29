import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface JobUpdateData {
  job_type?: string;
  cron_schedule?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
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

    const { id, ...updateData }: JobUpdateData & { id: string } = await req.json()

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate cron schedule if provided
    if (updateData.cron_schedule) {
      const cronParts = updateData.cron_schedule.trim().split(/\s+/)
      if (cronParts.length !== 5) {
        return new Response(
          JSON.stringify({ error: 'Invalid cron schedule format. Expected: * * * * *' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Update job
    const { data, error } = await supabaseClient
      .from('scheduled_jobs')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        job_execution_logs(
          id,
          started_at,
          completed_at,
          status,
          duration_ms,
          records_processed,
          error_message
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update job', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate stats from logs
    const logs = data.job_execution_logs || []
    const totalRuns = logs.length
    const successRuns = logs.filter(log => log.status === 'success').length
    const averageDuration = logs.length > 0 
      ? logs.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / logs.length 
      : null

    // Get last log
    const lastLog = logs.length > 0 
      ? logs.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0]
      : null

    // Transform response to match expected format
    const jobSummary = {
      id: data.id,
      job_name: data.job_name,
      job_type: data.job_type,
      cron_schedule: data.cron_schedule,
      enabled: data.enabled,
      last_run_at: data.last_run_at,
      next_run_at: data.next_run_at,
      config: data.config,
      is_due: data.enabled && new Date(data.next_run_at) <= new Date(),
      average_duration_ms: averageDuration,
      stats: {
        total_runs: totalRuns,
        success_runs: successRuns
      },
      last_log: lastLog ? {
        id: lastLog.id,
        started_at: lastLog.started_at,
        completed_at: lastLog.completed_at,
        status: lastLog.status,
        duration_ms: lastLog.duration_ms,
        records_processed: lastLog.records_processed,
        error_message: lastLog.error_message
      } : null,
      recent_logs: logs.slice(0, 5).map(log => ({
        id: log.id,
        started_at: log.started_at,
        completed_at: log.completed_at,
        status: log.status,
        duration_ms: log.duration_ms,
        records_processed: log.records_processed,
        error_message: log.error_message
      }))
    }

    return new Response(
      JSON.stringify(jobSummary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in jobs-update function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})