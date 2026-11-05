'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidEmail, isUaEmail, safeRedirectPath } from '@/lib/validation';
import { ROLES, UA_EMAIL_DOMAIN } from '@/lib/constants';

export async function loginAction(prevState, formData) {
  let email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = safeRedirectPath(formData.get('next'));

  // The email field shows "@ua.edu.ph" as a hint: a bare username means a UA address.
  if (email && !email.includes('@')) email = `${email}@${UA_EMAIL_DOMAIN}`;

  if (!isValidEmail(email) || !password) {
    return { error: 'Please enter a valid email and password.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Same message for every failure so attackers cannot tell which emails exist.
    return { error: 'Invalid email or password, or your email is not yet confirmed.' };
  }

  // Only UA students may use the portal (admin accounts are authorized by their role).
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  if (profile?.role === ROLES.STUDENT && !isUaEmail(data.user.email)) {
    await supabase.auth.signOut();
    return { error: `Please log in with your UA email account (@${UA_EMAIL_DOMAIN}).` };
  }

  redirect(next);
}
