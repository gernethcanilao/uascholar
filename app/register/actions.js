'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidEmail } from '@/lib/validation';

const MIN_PASSWORD_LENGTH = 8;

export async function registerAction(prevState, formData) {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (fullName.length < 2 || fullName.length > 150) return { error: 'Please enter your full name.' };
  if (!isValidEmail(email)) return { error: 'Please enter a valid email address.' };
  if (password.length < MIN_PASSWORD_LENGTH || password.length > 72) {
    return { error: `Password must be ${MIN_PASSWORD_LENGTH} to 72 characters long.` };
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { error: 'Password must contain at least one letter and one number.' };
  }
  if (password !== confirmPassword) return { error: 'Passwords do not match.' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/student/profile`,
    },
  });

  if (error) {
    console.error('Sign up failed:', error.message);
    return { error: 'Registration failed. Please try again or use a different email.' };
  }

  // If email confirmation is disabled in Supabase, the user is already logged in.
  if (data.session) redirect('/student/profile');

  return { success: 'Account created! Please check your email to confirm your account, then log in.' };
}
