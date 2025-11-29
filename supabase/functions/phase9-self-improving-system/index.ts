// Phase 9: Self-Improving System Edge Functions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/zod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validation schemas
const featureGenerationSchema = z.object({
  feature_types: z.array(z.enum(['polynomial', 'interaction', 'ratio', 'temporal', 'aggregate'])),
  base_features: z.array(z.string().min(1)),
  sample_size: z.number().min(100).max(10000).optional(),
  test_duration_days: z.number().min(7).max(90).optional()
})

const featureTestSchema = z.object({
  experiment_id: z.string().uuid()
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
    )

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/')

    // Route handling
    if (pathSegments[3] === 'self-improving') {
      if (pathSegments[4] === 'generate-features' && req.method === 'POST') {
        return await handleGenerateFeatures(req, supabase)
      }
      if (pathSegments[4] === 'test-feature' && req.method === 'POST') {
        return await handleTestFeature(req, supabase)
      }
      if (pathSegments[4] === 'continuous-learning' && req.method === 'POST') {
        return await handleContinuousLearning(req, supabase)
      }
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    )
  } catch (error) {
    console.error('Error in self-improving-system function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Handle feature generation
async function handleGenerateFeatures(req: Request, supabase: { from(table: string): unknown }) {
  try {
    const body = await req.json()
    const validatedData = featureGenerationSchema.parse(body)

    const experiments = []

    // Generate different types of features
    for (const featureType of validatedData.feature_types) {
      const typeExperiments = await generateFeaturesByType(
        featureType,
        validatedData.base_features,
        validatedData.sample_size || 1000,
        validatedData.test_duration_days || 30
      )
      experiments.push(...typeExperiments)
    }

    // Store experiments in database
    if (experiments.length > 0) {
      const { data: storedExperiments, error: storeError } = await supabase
        .from('feature_experiments')
        .insert(experiments)
        .select()

      if (storeError) throw storeError

      return new Response(
        JSON.stringify({ 
          success: true, 
          experiments: storedExperiments 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        experiments: [] 
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

// Handle feature testing
async function handleTestFeature(req: Request, supabase: { from(table: string): unknown }) {
  try {
    const body = await req.json()
    const validatedData = featureTestSchema.parse(body)

    // Get experiment details
    const { data: experiment, error: fetchError } = await supabase
      .from('feature_experiments')
      .select('*')
      .eq('id', validatedData.experiment_id)
      .single()

    if (fetchError) throw fetchError

    // Simulate A/B testing - in real implementation, this would run actual tests
    const testResult = await simulateFeatureTest(experiment)

    // Update experiment with results
    const { error: updateError } = await supabase
      .from('feature_experiments')
      .update({
        test_end_date: new Date().toISOString(),
        sample_size: testResult.sampleSize,
        control_accuracy: testResult.controlAccuracy,
        test_accuracy: testResult.testAccuracy,
        improvement_delta: testResult.improvementDelta,
        p_value: testResult.pValue,
        statistical_significance: testResult.statisticalSignificance,
        is_active: false
      })
      .eq('id', validatedData.experiment_id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ 
        success: true, 
        result: testResult 
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

// Handle continuous learning pipeline
async function handleContinuousLearning(req: Request, supabase: { from(table: string): unknown }) {
  try {
    let experimentsGenerated = 0
    let experimentsCompleted = 0
    let featuresApproved = 0
    let modelAccuracyImprovement = 0

    // Step 1: Generate new feature experiments
    const generationRequest = {
      feature_types: ['polynomial', 'interaction', 'ratio'],
      base_features: ['home_form', 'away_form', 'h2h_record', 'league_avg_goals'],
      sample_size: 2000,
      test_duration_days: 14
    }

    const generationResult = await generateFeaturesByType(
      'polynomial',
      generationRequest.base_features,
      generationRequest.sample_size,
      generationRequest.test_duration_days
    )
    
    experimentsGenerated = generationResult.length

    // Store generated experiments
    if (experimentsGenerated > 0) {
      const { error: storeError } = await supabase
        .from('feature_experiments')
        .insert(generationResult)

      if (storeError) throw storeError
    }

    // Step 2: Test active experiments
    const { data: activeExperiments, error: activeError } = await supabase
      .from('feature_experiments')
      .select('*')
      .eq('is_active', true)
      .limit(10) // Limit to prevent too much processing

    if (activeError) throw activeError

    // Step 3: Test each experiment
    for (const experiment of activeExperiments) {
      const testResult = await simulateFeatureTest(experiment)
      
      // Update experiment with results
      await supabase
        .from('feature_experiments')
        .update({
          test_end_date: new Date().toISOString(),
          sample_size: testResult.sampleSize,
          control_accuracy: testResult.controlAccuracy,
          test_accuracy: testResult.testAccuracy,
          improvement_delta: testResult.improvementDelta,
          p_value: testResult.pValue,
          statistical_significance: testResult.statisticalSignificance,
          is_active: false
        })
        .eq('id', experiment.id)

      experimentsCompleted++

      // Step 4: Approve successful features
      if (testResult.recommendation === 'approve') {
        await supabase
          .from('feature_experiments')
          .update({
            is_approved: true
          })
          .eq('id', experiment.id)

        featuresApproved++
        modelAccuracyImprovement += testResult.improvementDelta
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: {
          experimentsGenerated,
          experimentsCompleted,
          featuresApproved,
          modelAccuracyImprovement
        }
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

// Generate features by type
async function generateFeaturesByType(
  featureType: string,
  baseFeatures: string[],
  sampleSize: number,
  testDurationDays: number
) {
  const experiments = []

  switch (featureType) {
    case 'polynomial':
      // Generate polynomial features (e.g., x², x³)
      for (const feature of baseFeatures) {
        for (let degree = 2; degree <= 3; degree++) {
          experiments.push({
            experiment_name: `${feature}_poly_${degree}`,
            feature_type: 'polynomial',
            base_features: { features: [feature] },
            generated_feature: { 
              name: `${feature}_power_${degree}`,
              description: `Polynomial feature: ${feature}^${degree}`
            },
            feature_expression: `${feature}^${degree}`,
            test_start_date: new Date().toISOString(),
            test_end_date: new Date(Date.now() + testDurationDays * 24 * 60 * 60 * 1000).toISOString(),
            sample_size: sampleSize,
            statistical_significance: false,
            is_active: true,
            is_approved: false
          })
        }
      }
      break

    case 'interaction':
      // Generate interaction features (e.g., x₁ * x₂)
      for (let i = 0; i < baseFeatures.length; i++) {
        for (let j = i + 1; j < baseFeatures.length; j++) {
          experiments.push({
            experiment_name: `${baseFeatures[i]}_x_${baseFeatures[j]}`,
            feature_type: 'interaction',
            base_features: { features: [baseFeatures[i], baseFeatures[j]] },
            generated_feature: {
              name: `${baseFeatures[i]}_${baseFeatures[j]}_interaction`,
              description: `Interaction feature: ${baseFeatures[i]} * ${baseFeatures[j]}`
            },
            feature_expression: `${baseFeatures[i]} * ${baseFeatures[j]}`,
            test_start_date: new Date().toISOString(),
            test_end_date: new Date(Date.now() + testDurationDays * 24 * 60 * 60 * 1000).toISOString(),
            sample_size: sampleSize,
            statistical_significance: false,
            is_active: true,
            is_approved: false
          })
        }
      }
      break

    case 'ratio':
      // Generate ratio features (e.g., x₁ / x₂)
      for (let i = 0; i < baseFeatures.length; i++) {
        for (let j = 0; j < baseFeatures.length; j++) {
          if (i !== j) {
            experiments.push({
              experiment_name: `${baseFeatures[i]}_div_${baseFeatures[j]}`,
              feature_type: 'ratio',
              base_features: { features: [baseFeatures[i], baseFeatures[j]] },
              generated_feature: {
                name: `${baseFeatures[i]}_to_${baseFeatures[j]}_ratio`,
                description: `Ratio feature: ${baseFeatures[i]} / ${baseFeatures[j]}`
              },
              feature_expression: `${baseFeatures[i]} / (${baseFeatures[j]} + 1)`, // +1 to avoid division by zero
              test_start_date: new Date().toISOString(),
              test_end_date: new Date(Date.now() + testDurationDays * 24 * 60 * 60 * 1000).toISOString(),
              sample_size: sampleSize,
              statistical_significance: false,
              is_active: true,
              is_approved: false
            })
          }
        }
      }
      break
  }

  return experiments
}

// Simulate feature testing (in real implementation, this would run actual A/B tests)
async function simulateFeatureTest(experiment: { id: string; feature_expression: string }) {
  // Simulate A/B testing results
  const controlAccuracy = 65 + Math.random() * 10 // 65-75%
  const testAccuracy = controlAccuracy + (Math.random() - 0.3) * 5 // -1.5% to +3.5%
  const improvement = testAccuracy - controlAccuracy
  const pValue = Math.random() // Simulated p-value

  const statisticalSignificance = pValue < 0.05 && improvement > 0

  let recommendation: 'approve' | 'reject' | 'continue_testing'
  if (statisticalSignificance && improvement > 2) {
    recommendation = 'approve'
  } else if (improvement > 0 && pValue < 0.1) {
    recommendation = 'continue_testing'
  } else {
    recommendation = 'reject'
  }

  return {
    experiment_id: experiment.id,
    control_accuracy: controlAccuracy,
    test_accuracy: testAccuracy,
    improvement_delta: improvement,
    p_value: pValue,
    statistical_significance: statisticalSignificance,
    recommendation,
    sampleSize: Math.floor(Math.random() * 1000) + 500
  }
}