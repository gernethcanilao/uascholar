import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './config';

/** Thrown when a required server setting (environment variable) is missing. */
export class ConfigError extends Error {}

/**
 * Supabase client with the SERVICE key. It bypasses Row Level Security, so it is used
 * ONLY for first-time account setup (lib/verification.js): verification codes and
 * creating the account after a correct code. Never import it in client components.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new ConfigError('SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is not set.');

  return createSupabaseClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
