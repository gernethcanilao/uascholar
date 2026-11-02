// Prisma 7 configuration. Prisma does not load env files by itself,
// so we read the same files Next.js uses (.env.local wins over .env).
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: ['.env.local', '.env'], quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Use the Supabase SESSION pooler (port 5432) or direct connection.
    // Do NOT use the transaction pooler (port 6543) for migrations.
    url: process.env.DATABASE_URL,
  },
});
