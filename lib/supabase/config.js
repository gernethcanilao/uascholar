/**
 * Supabase connection settings shared by the browser, server and middleware clients.
 * Supports Supabase's new "publishable" key name and the older "anon" key name.
 * (Must use literal process.env.NEXT_PUBLIC_* names so Next.js can inline them in the browser.)
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const SUPABASE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) {
  throw new Error(
    'Missing Supabase settings: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env or .env.local'
  );
}
