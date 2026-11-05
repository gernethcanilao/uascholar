'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidEmail, isUaEmail, safeRedirectPath } from '@/lib/validation';
import { ROLES, UA_EMAIL_DOMAIN } from '@/lib/constants';

const MIN_PASSWORD_LENGTH = 8;

/**
 * One form, several steps (state.step):
 *   email       -> check the email: existing account, authorized for setup, or not authorized
 *   password    -> regular login with email + password
 *   code        -> first-time setup: verify the code sent to the UA email
 *   setPassword -> first-time setup: create a password (only after the code was verified)
 */
export async function loginAction(prevState, formData) {
  const next = safeRedirectPath(formData.get('next'));
  const intent = String(formData.get('intent') ?? '');
  const step = String(formData.get('step') ?? 'email');

  if (intent === 'restart') return { step: 'email' };

  const email = readEmail(formData);
  if (!isValidEmail(email)) {
    return { step: 'email', error: 'Please enter a valid email address.' };
  }

  const supabase = await createClient();

  // "Send a new code" goes through the same authorization check as step 1.
  if (intent !== 'resend') {
    if (step === 'password') return loginWithPassword(supabase, email, formData, next);
    if (step === 'code') return verifySetupCode(supabase, email, formData);
    if (step === 'setPassword') return createPassword(supabase, email, formData, next);
  }

  // Step 1: decide what this email does next.
  const { data: status, error } = await supabase.rpc('account_setup_status', { target_email: email });
  if (error) {
    console.error('Account status check failed:', error.message);
    return { step: 'email', email, error: 'Something went wrong. Please try again.' };
  }

  if (status === 'existing') return { step: 'password', email };
  if (status === 'authorized') return sendSetupCode(supabase, email);

  return {
    step: 'email',
    email,
    error: 'This email is not currently authorized to set up an account. Please contact the UA Scholarship Office.',
  };
}

/** The email field shows "@ua.edu.ph" as a hint: a bare username means a UA address. */
function readEmail(formData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  return email && !email.includes('@') ? `${email}@${UA_EMAIL_DOMAIN}` : email;
}

async function loginWithPassword(supabase, email, formData, next) {
  const password = String(formData.get('password') ?? '');
  if (!password) return { step: 'password', email, error: 'Please enter your password.' };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Same message for every failure so attackers cannot tell what was wrong.
    return { step: 'password', email, error: 'Invalid email or password.' };
  }

  // Only UA students may use the portal (admin accounts are authorized by their role).
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  if (profile?.role === ROLES.STUDENT && !isUaEmail(data.user.email)) {
    await supabase.auth.signOut();
    return { step: 'email', error: `Please log in with your UA email account (@${UA_EMAIL_DOMAIN}).` };
  }

  redirect(next);
}

/**
 * Sends a one-time code to the student's UA email (Supabase Auth email OTP).
 * Supabase creates the auth user only if the database trigger finds the email on the
 * authorized list, and it enforces code expiry and request/verification rate limits.
 */
async function sendSetupCode(supabase, email) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });

  if (error) {
    if (error.status === 429) {
      return { step: 'code', email, error: 'Please wait a minute before requesting another code.' };
    }
    console.error('Sending setup code failed:', error.message);
    return { step: 'email', email, error: 'We could not send a verification code right now. Please try again later.' };
  }

  return {
    step: 'code',
    email,
    success: `We sent a verification code to ${email}. Enter it below to set up your account.`,
  };
}

async function verifySetupCode(supabase, email, formData) {
  const token = String(formData.get('code') ?? '').replace(/\s/g, '');
  if (!/^\d{6,10}$/.test(token)) {
    return { step: 'code', email, error: 'Please enter the verification code from your email.' };
  }

  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) {
    if (error.status === 429) {
      return { step: 'code', email, error: 'Too many attempts. Please wait a few minutes and try again.' };
    }
    return { step: 'code', email, error: 'The code is incorrect or has expired. Check the code or request a new one.' };
  }

  return { step: 'setPassword', email, success: 'Your email is verified. Create a password to finish setting up your account.' };
}

async function createPassword(supabase, email, formData, next) {
  const password = String(formData.get('newPassword') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (password.length < MIN_PASSWORD_LENGTH || password.length > 72) {
    return { step: 'setPassword', email, error: `Password must be ${MIN_PASSWORD_LENGTH} to 72 characters long.` };
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { step: 'setPassword', email, error: 'Password must contain at least one letter and one number.' };
  }
  if (password !== confirmPassword) {
    return { step: 'setPassword', email, error: 'Passwords do not match.' };
  }

  // A password can only be set from the session created by a verified code.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== email || !user.email_confirmed_at) {
    return { step: 'email', error: 'Your verification has expired. Please start again.' };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error('Setting password failed:', error.message);
    return { step: 'setPassword', email, error: 'We could not save your password. Please try a different password.' };
  }

  redirect(next);
}
