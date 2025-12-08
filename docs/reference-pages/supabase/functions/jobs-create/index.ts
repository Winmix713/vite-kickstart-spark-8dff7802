import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface JobFormData {
  job_name: string;
  job_type: string;
  cron_schedule: string;
  enabled: boolean;
  config: Record<string, unknown>;
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

    const jobData: JobFormData = await req.json()

    // Validate required fields
    if (!jobData.job_name || !jobData.job_type || !jobData.cron_schedule) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: job_name, job_type, cron_schedule' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate cron schedule format
    const cronParts = jobData.cron_schedule.trim().split(/\s+/)
    if (cronParts.length !== 5) {
      return new Response(
        JSON.stringify({ error: 'Invalid cron schedule format. Expected: * * * * *' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if job name already exists
    const { data: existingJob } = await supabaseClient
      .from('scheduled_jobs')
      .select('id')
      .eq('job_name', jobData.job_name)
      .single()

    if (existingJob) {
      return new Response(
        JSON.stringify({ error: 'Job with this name already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate next run time (simplified - in production you'd use a proper cron parser)
    const nextRunAt = new Date()
    nextRunAt.setHours(nextRunAt.getHours() + 1) // Simple: run in 1 hour

    // Insert the new job
    const { data, error } = await supabaseClient
      .from('scheduled_jobs')
      .insert({
        job_name: jobData.job_name,
        job_type: jobData.job_type,
        cron_schedule: jobData.cron_schedule,
        enabled: jobData.enabled,
        config: jobData.config || {},
        next_run_at: nextRunAt.toISOString()
      })
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
        JSON.stringify({ error: 'Failed to create job', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Transform the response to match expected format
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
      average_duration_ms: null, // Calculate from logs if needed
      stats: {
        total_runs: 0,
        success_runs: 0
      },
      last_log: null,
      recent_logs: []
    }

    return new Response(
      JSON.stringify(jobSummary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in jobs-create function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})