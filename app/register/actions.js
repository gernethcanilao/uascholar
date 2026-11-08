'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidEmail } from '@/lib/validation';
import { pickFormValues } from '@/lib/actions';
import { formatPersonName, normalizeSuffix, composeFullName, SUFFIX_EXAMPLES } from '@/lib/names';

const MIN_PASSWORD_LENGTH = 8;

// Text fields sent back after an error so the form keeps them (never the passwords).
const KEEP_FIELDS = ['firstName', 'lastName', 'suffix', 'email'];

export async function registerAction(prevState, formData) {
  const firstName = formatPersonName(formData.get('firstName'));
  const lastName = formatPersonName(formData.get('lastName'));
  const suffix = normalizeSuffix(formData.get('suffix'));
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  // Check every field so each problem can be shown next to its field.
  const fieldErrors = {};
  if (!firstName) fieldErrors.firstName = 'First name is required.';
  else if (firstName.length > 75) fieldErrors.firstName = 'First name must be 75 characters or less.';
  if (!lastName) fieldErrors.lastName = 'Last name is required.';
  else if (lastName.length > 75) fieldErrors.lastName = 'Last name must be 75 characters or less.';
  if (suffix === null) fieldErrors.suffix = `Use a suffix such as ${SUFFIX_EXAMPLES}, or leave it blank.`;
  if (!email) fieldErrors.email = 'Email is required.';
  else if (!isValidEmail(email)) fieldErrors.email = 'Please enter a valid email address.';
  if (!password) {
    fieldErrors.password = 'Password is required.';
  } else if (password.length < MIN_PASSWORD_LENGTH || password.length > 72) {
    fieldErrors.password = `Password must be ${MIN_PASSWORD_LENGTH} to 72 characters long.`;
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    fieldErrors.password = 'Password must contain at least one letter and one number.';
  }
  if (!confirmPassword) fieldErrors.confirmPassword = 'Please confirm your password.';
  else if (password && password !== confirmPassword) fieldErrors.confirmPassword = 'Passwords do not match.';

  if (Object.keys(fieldErrors).length) {
    return {
      error: 'Please complete the highlighted fields.',
      fieldErrors,
      values: pickFormValues(formData, KEEP_FIELDS),
    };
  }

  const fullName = composeFullName(firstName, lastName, suffix);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Stored separately on the auth user; full_name is still used by the profiles trigger and admin views.
      data: { first_name: firstName, last_name: lastName, suffix, full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/student/profile`,
    },
  });

  if (error) {
    console.error('Sign up failed:', error.message);
    return {
      error: 'Registration failed. Please try again or use a different email.',
      values: pickFormValues(formData, KEEP_FIELDS),
    };
  }

  // If email confirmation is disabled in Supabase, the user is already logged in.
  if (data.session) redirect('/student/profile');

  return { success: 'Account created! Please check your email to confirm your account, then log in.' };
}
