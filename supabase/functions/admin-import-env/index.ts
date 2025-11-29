import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface EnvImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

interface EnvVariable {
  key: string;
  value: string;
  description?: string;
  is_secret?: boolean;
  category?: string;
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

    // Check if user is admin
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

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { content } = await req.json()

    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid content provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result: EnvImportResult = {
      imported: 0,
      skipped: 0,
      errors: []
    }

    // Parse .env file content
    const lines = content.split('\n')
    const envVars: EnvVariable[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) {
        continue
      }

      // Parse KEY=VALUE format
      const match = line.match(/^([^=]+)=(.*)$/)
      if (!match) {
        result.errors.push(`Line ${i + 1}: Invalid format - expected KEY=VALUE`)
        continue
      }

      const [, key, value] = match
      const cleanKey = key.trim()
      const cleanValue = value.trim().replace(/^["']|["']$/g, '') // Remove quotes

      // Determine if it's a secret based on common patterns
      const isSecret = /password|secret|key|token|auth/i.test(cleanKey)
      
      // Determine category based on key patterns
      let category = 'general'
      if (/database|db|postgres/i.test(cleanKey)) category = 'database'
      else if (/smtp|email|mail/i.test(cleanKey)) category = 'email'
      else if (/api|rest|endpoint/i.test(cleanKey)) category = 'api'
      else if (/secret|security|jwt|auth/i.test(cleanKey)) category = 'security'
      else if (/redis|cache/i.test(cleanKey)) category = 'cache'
      else if (/ai|model|prediction|ml/i.test(cleanKey)) category = 'ai'
      else if (/log|level|debug/i.test(cleanKey)) category = 'logging'
      else if (/limit|rate|throttle/i.test(cleanKey)) category = 'limits'

      envVars.push({
        key: cleanKey,
        value: cleanValue,
        is_secret: isSecret,
        category: category
      })
    }

    // Insert or update environment variables
    for (const envVar of envVars) {
      try {
        // Check if variable already exists
        const { data: existing } = await supabaseClient
          .from('environment_variables')
          .select('id')
          .eq('key', envVar.key)
          .single()

        if (existing) {
          result.skipped++
        } else {
          const { error } = await supabaseClient
            .from('environment_variables')
            .insert({
              key: envVar.key,
              value: envVar.value,
              is_secret: envVar.is_secret || false,
              category: envVar.category || 'general',
              created_by: user.id
            })

          if (error) {
            result.errors.push(`Failed to import ${envVar.key}: ${error.message}`)
          } else {
            result.imported++
          }
        }
      } catch (error) {
        result.errors.push(`Error processing ${envVar.key}: ${error.message}`)
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in admin-import-env function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})