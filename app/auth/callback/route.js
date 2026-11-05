import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isUaEmail, safeRedirectPath } from '@/lib/validation';
import { ROLES } from '@/lib/constants';

/** Handles the redirect back from Supabase email links (for example, a sign-in link in the code email). */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeRedirectPath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Only UA students may use the portal (admin accounts are authorized by their role).
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
      if (!profile || (profile.role === ROLES.STUDENT && !isUaEmail(data.user.email))) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=domain`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('OAuth code exchange failed:', error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
