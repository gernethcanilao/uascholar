'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidEmail, safeRedirectPath } from '@/lib/validation';

export async function loginAction(prevState, formData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = safeRedirectPath(formData.get('next'));

  if (!isValidEmail(email) || !password) {
    return { error: 'Please enter a valid email and password.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Same message for every failure so attackers cannot tell which emails exist.
    return { error: 'Invalid email or password, or your email is not yet confirmed.' };
  }

  redirect(next);
}
