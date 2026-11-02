// Creates a new Prisma migration from changes in prisma/schema.prisma.
//
//   npm run db:new -- add_scholarship_slots
//
// It compares the LIVE database (DATABASE_URL) with schema.prisma and writes
// the SQL to prisma/migrations/<timestamp>_<name>/migration.sql.
// We avoid `prisma migrate dev` because its shadow database does not have
// Supabase's auth/storage schemas used by the security migration.
//
// Always READ the generated SQL before running `npm run db:migrate`.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

const name = (process.argv[2] ?? '').toLowerCase().replace(/[^a-z0-9_]/g, '_');
if (!name) {
  console.error('Usage: npm run db:new -- <migration_name>');
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const folder = path.join('prisma', 'migrations', `${timestamp}_${name}`);
const file = path.join(folder, 'migration.sql');
mkdirSync(folder, { recursive: true });

execFileSync(
  'npx',
  ['prisma', 'migrate', 'diff', '--from-config-datasource', '--to-schema', 'prisma/schema.prisma', '--script', '-o', file],
  { stdio: 'inherit', shell: process.platform === 'win32' }
);

const sql = readFileSync(file, 'utf8');
if (!/\b(CREATE|ALTER|DROP)\b/i.test(sql)) {
  rmSync(folder, { recursive: true, force: true });
  console.log('No schema changes found. Nothing was created.');
} else {
  console.log(`\nCreated ${file}\nReview it, then run: npm run db:migrate`);
}
