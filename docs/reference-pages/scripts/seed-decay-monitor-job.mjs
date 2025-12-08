#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function seedDecayMonitorJob() {
  console.log('Seeding model decay monitor job...');

  const job = {
    job_name: 'model_decay_monitor',
    job_type: 'monitoring',
    cron_schedule: '0 3 * * *', // Daily at 3:00 AM
    enabled: true,
    next_run_at: new Date().toISOString(),
    config: {
      description: 'Daily accuracy decay detection and alert generation',
      function_name: 'model-decay-monitor',
      retention_days: 30,
      alert_threshold: 20, // Percentage drop threshold for alerts
    },
  };

  // Check if job already exists
  const { data: existing } = await supabase
    .from('scheduled_jobs')
    .select('id')
    .eq('job_name', 'model_decay_monitor')
    .maybeSingle();

  if (existing) {
    console.log('Job already exists, updating configuration...');
    const { error } = await supabase
      .from('scheduled_jobs')
      .update({
        cron_schedule: job.cron_schedule,
        config: job.config,
        enabled: job.enabled,
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Failed to update job:', error);
      process.exit(1);
    }
    console.log('Job updated successfully');
  } else {
    console.log('Creating new job...');
    const { error } = await supabase.from('scheduled_jobs').insert(job);

    if (error) {
      console.error('Failed to create job:', error);
      process.exit(1);
    }
    console.log('Job created successfully');
  }

  // Verify the job was created/updated
  const { data: job_data } = await supabase
    .from('scheduled_jobs')
    .select('*')
    .eq('job_name', 'model_decay_monitor')
    .single();

  console.log('\nJob configuration:');
  console.log(JSON.stringify(job_data, null, 2));
}

async function main() {
  await seedDecayMonitorJob();
  console.log('\nModel decay monitor job seeded successfully!');
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
