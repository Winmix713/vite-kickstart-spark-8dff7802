#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { spawnSync } from 'node:child_process';

const MIGRATIONS_DIR = resolve(process.cwd(), 'supabase', 'migrations');
const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

function listSqlFiles(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql'));
  return files.sort(); // migrations are timestamp-prefixed
}

function runWithPsql(sql, databaseUrl) {
  const result = spawnSync('psql', ['-v', 'ON_ERROR_STOP=1', databaseUrl], {
    input: sql,
    encoding: 'utf-8',
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  return result.status === 0;
}

function main() {
  const files = listSqlFiles(MIGRATIONS_DIR);
  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  console.log(`Found ${files.length} migration(s):`);
  files.forEach((f) => console.log(` - ${f}`));

  if (!DATABASE_URL) {
    console.log('\nNo DATABASE_URL provided.');
    console.log('To apply migrations, either:');
    console.log('  - Set DATABASE_URL to your Postgres connection string and ensure psql is installed');
    console.log('  - Or use the Supabase CLI: supabase db push');
    process.exit(0);
  }

  console.log(`\nApplying migrations using psql to ${new URL(DATABASE_URL).host}...`);

  for (const file of files) {
    const fullPath = resolve(MIGRATIONS_DIR, file);
    const sql = readFileSync(fullPath, 'utf-8');
    console.log(`\n> Running ${basename(file)}...`);
    const ok = runWithPsql(sql, DATABASE_URL);
    if (!ok) {
      console.error(`Migration failed: ${file}`);
      process.exit(1);
    }
  }

  console.log('\nMigrations applied successfully.');
}

main();
