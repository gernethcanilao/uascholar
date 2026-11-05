'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ConfigError } from '@/lib/supabase/admin';
import { sendVerificationCode, verifyCode, createAccount, SETUP_TOKEN_TTL_MS } from '@/lib/verification';
import { isValidEmail, isUaEmail, safeRedirectPath, ValidationError } from '@/lib/validation';
import { ROLES, UA_EMAIL_DOMAIN } from '@/lib/constants';

const MIN_PASSWORD_LENGTH = 8;
// httpOnly cookie that proves THIS browser entered the correct code (holds the one-time setup token).
const SETUP_COOKIE = 'ua_setup';

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
    if (step === 'code') return verifySetupCode(email, formData);
    if (step === 'setPassword') return createPassword(supabase, email, formData, next);
  }

  // Step 1: decide what this email does next.
  const { data: status, error } = await supabase.rpc('account_setup_status', { target_email: email });
  if (error) {
    console.error('Account status check failed:', error.message);
    return { step: 'email', email, error: 'Something went wrong. Please try again.' };
  }

  if (status === 'existing') return { step: 'password', email };
  if (status === 'authorized') return sendSetupCode(email);

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

/** Turns setup errors into messages for the form (details stay in the server log). */
function setupError(error, step, email) {
  if (error instanceof ValidationError) return { step, email, error: error.message };
  if (error instanceof ConfigError) {
    console.error('Email verification is not configured:', error.message);
    return {
      step: 'email',
      email,
      error: 'Email verification is not set up on the server yet, so no code could be sent. Please contact the administrator.',
    };
  }
  console.error('Account setup step failed:', error?.message ?? error);
  return {
    step: step === 'code' ? 'code' : 'email',
    email,
    error: 'We could not send or check the verification code right now. Please try again later.',
  };
}

/** Emails a new 6-digit code (Resend) to an authorized student. See lib/verification.js. */
async function sendSetupCode(email) {
  try {
    await sendVerificationCode(email);
  } catch (error) {
    return setupError(error, 'code', email);
  }

  return {
    step: 'code',
    email,
    success: `We sent a 6-digit verification code to ${email}. It expires in 5 minutes.`,
  };
}

async function verifySetupCode(email, formData) {
  const code = String(formData.get('code') ?? '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(code)) {
    return { step: 'code', email, error: 'Please enter the 6-digit code from your email.' };
  }

  let setupToken;
  try {
    setupToken = await verifyCode(email, code);
  } catch (error) {
    return setupError(error, 'code', email);
  }

  (await cookies()).set(SETUP_COOKIE, setupToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/login',
    maxAge: SETUP_TOKEN_TTL_MS / 1000,
  });

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

  // The account is created only with the setup token from a correct code (httpOnly cookie).
  const cookieStore = await cookies();
  try {
    await createAccount(email, cookieStore.get(SETUP_COOKIE)?.value, password);
  } catch (error) {
    if (error instanceof ValidationError && error.message.startsWith('Your verification has expired')) {
      return { step: 'email', error: error.message };
    }
    return setupError(error, 'setPassword', email);
  }
  cookieStore.delete({ name: SETUP_COOKIE, path: '/login' });

  // Log the student in with the new password and go to the dashboard.
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Login after account setup failed:', error.message);
    return { step: 'password', email, success: 'Your account is ready. Please log in with your new password.' };
  }

  redirect(next);
}
