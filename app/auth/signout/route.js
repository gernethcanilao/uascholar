import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Signs the user out (POST only, so a simple link or image cannot log users out). */
export async function POST(request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}
