#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const [,, email, password, fullNameArg] = process.argv;

if (!email || !password) {
  console.log('Usage: node scripts/create-admin-user.mjs <email> <password> [full_name]');
  process.exit(1);
}

const full_name = fullNameArg || email;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function ensureProfile(user) {
  const { error } = await admin
    .from('user_profiles')
    .upsert({
      id: user.id,
      email: user.email,
      role: 'admin',
      full_name,
    }, { onConflict: 'id' });

  if (error) throw error;
}

async function main() {
  console.log(`Creating admin user: ${email}`);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (error) {
    if (error.message && error.message.includes('already registered')) {
      console.log('User already exists, updating role to admin...');
      const { data: lookup, error: lookupErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (lookupErr) throw lookupErr;
      const existing = lookup.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!existing) throw new Error('User exists in auth but could not be found');
      await ensureProfile(existing);
    } else {
      throw error;
    }
  } else if (data?.user) {
    await ensureProfile(data.user);
  }

  console.log('Admin user ensured in user_profiles.');
}

main().catch((e) => {
  console.error('Failed to create admin user:', e);
  process.exit(1);
});
