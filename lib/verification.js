import 'server-only';
import crypto from 'node:crypto';
import { createAdminClient } from './supabase/admin';
import { sendEmail } from './email';
import { ValidationError } from './validation';

/**
 * First-time account setup with an emailed 6-digit code.
 *
 *   sendVerificationCode(email)              -> emails a new code (rate limited)
 *   verifyCode(email, code)                  -> checks the code, returns a one-time setup token
 *   createAccount(email, setupToken, pw)     -> creates the account (only with a valid setup token)
 *
 * Codes and setup tokens are stored only as HMAC-SHA256 hashes (key derived from AES_SECRET_KEY).
 * Callers must first check that the email is authorized (account_setup_status = 'authorized').
 */

const CODE_TTL_MS = 5 * 60 * 1000; // a code expires after 5 minutes
const RESEND_INTERVAL_MS = 60 * 1000; // at most one code per minute
const SEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5; // at most 5 codes per hour per email
const MAX_ATTEMPTS = 5; // wrong codes allowed before a new code is needed
export const SETUP_TOKEN_TTL_MS = 10 * 60 * 1000; // time to create the password after verifying

let hmacKey = null;

function getHmacKey() {
  if (hmacKey) return hmacKey;
  const secret = process.env.AES_SECRET_KEY;
  if (!secret || secret.length < 32) throw new Error('AES_SECRET_KEY must be set (at least 32 characters).');
  hmacKey = Buffer.from(crypto.hkdfSync('sha256', secret, 'ua-scholar', 'verification-codes:v1', 32));
  return hmacKey;
}

function hash(value) {
  return crypto.createHmac('sha256', getHmacKey()).update(value).digest('base64url');
}

function hashesMatch(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

const codeHash = (email, code) => hash(`code:${email}:${code}`);
const tokenHash = (email, token) => hash(`setup:${email}:${token}`);

async function getRow(admin, email) {
  const { data, error } = await admin.from('verification_codes').select('*').eq('email', email).maybeSingle();
  if (error) throw error;
  return data;
}

export async function sendVerificationCode(email) {
  const admin = createAdminClient();
  const row = await getRow(admin, email);
  const now = Date.now();

  if (row?.last_sent_at && now - Date.parse(row.last_sent_at) < RESEND_INTERVAL_MS) {
    throw new ValidationError('Please wait a minute before requesting another code.');
  }

  const windowActive = row?.send_window_start && now - Date.parse(row.send_window_start) < SEND_WINDOW_MS;
  const sendCount = windowActive ? row.send_count + 1 : 1;
  if (sendCount > MAX_SENDS_PER_WINDOW) {
    throw new ValidationError('Too many codes were requested for this email. Please try again in an hour.');
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

  // Saved before sending so the rate limit also counts failed sends.
  const { error } = await admin.from('verification_codes').upsert({
    email,
    code_hash: codeHash(email, code),
    expires_at: new Date(now + CODE_TTL_MS).toISOString(),
    attempts: 0,
    last_sent_at: new Date(now).toISOString(),
    send_window_start: windowActive ? row.send_window_start : new Date(now).toISOString(),
    send_count: sendCount,
    setup_token_hash: null,
    verified_at: null,
  });
  if (error) throw error;

  try {
    await sendEmail({
      to: email,
      subject: 'Your UA Scholar verification code',
      text:
        `Your verification code for UA Scholarship Website account setup is ${code}.\n\n` +
        'It expires in 5 minutes. If you did not request this code, you can ignore this email.\n\n' +
        'UA Scholar - University of the Assumption',
      html:
        '<p>Your verification code for <strong>UA Scholarship Website</strong> account setup is:</p>' +
        `<p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>` +
        '<p>It expires in 5 minutes. If you did not request this code, you can ignore this email.</p>' +
        '<p style="color:#6b7280">UA Scholar - University of the Assumption</p>',
    });
  } catch (sendError) {
    // The code was never delivered: make sure it cannot be used.
    await admin.from('verification_codes').update({ code_hash: null, expires_at: null }).eq('email', email);
    throw sendError;
  }
}

/** Returns a one-time setup token when the code is correct. */
export async function verifyCode(email, code) {
  const admin = createAdminClient();
  const row = await getRow(admin, email);

  if (!row?.code_hash || !row.expires_at || Date.parse(row.expires_at) < Date.now()) {
    throw new ValidationError('This code has expired or was already used. Please request a new code.');
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    throw new ValidationError('Too many incorrect attempts. Please request a new code.');
  }

  if (!hashesMatch(codeHash(email, code), row.code_hash)) {
    const attempts = row.attempts + 1;
    await admin.from('verification_codes').update({ attempts }).eq('email', email).eq('attempts', row.attempts);
    const left = MAX_ATTEMPTS - attempts;
    throw new ValidationError(
      left > 0
        ? `The code is incorrect. You have ${left} attempt${left === 1 ? '' : 's'} left.`
        : 'Too many incorrect attempts. Please request a new code.'
    );
  }

  // Correct: the code is used up (one time only) and replaced by a short-lived setup token.
  const setupToken = crypto.randomBytes(32).toString('base64url');
  const { data: updated, error } = await admin
    .from('verification_codes')
    .update({ code_hash: null, expires_at: null, verified_at: new Date().toISOString(), setup_token_hash: tokenHash(email, setupToken) })
    .eq('email', email)
    .eq('code_hash', row.code_hash)
    .select('email');
  if (error) throw error;
  if (!updated?.length) throw new ValidationError('This code was already used. Please request a new code.');

  return setupToken;
}

/** Creates the account (or finishes an unfinished one) after a verified code. */
export async function createAccount(email, setupToken, password) {
  const admin = createAdminClient();
  const row = await getRow(admin, email);

  const tokenValid =
    setupToken &&
    row?.setup_token_hash &&
    row.verified_at &&
    Date.now() - Date.parse(row.verified_at) < SETUP_TOKEN_TTL_MS &&
    hashesMatch(tokenHash(email, setupToken), row.setup_token_hash);
  if (!tokenValid) throw new ValidationError('Your verification has expired. Please start again.');

  const { data: authorized } = await admin
    .from('authorized_emails')
    .select('account_created_at')
    .eq('email', email)
    .maybeSingle();
  if (!authorized) throw new ValidationError('This email is not currently authorized to set up an account.');
  if (authorized.account_created_at) throw new ValidationError('An account already exists for this email. Please log in.');

  // An unfinished account may already exist (e.g. from an earlier setup attempt): finish it instead.
  const { data: profile } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
  const { error } = profile
    ? await admin.auth.admin.updateUserById(profile.id, { password, email_confirm: true })
    : await admin.auth.admin.createUser({ email, password, email_confirm: true });

  if (error) {
    console.error('Account setup failed:', error.message);
    if (error.code === 'weak_password') throw new ValidationError('This password is too weak. Please choose a stronger password.');
    if (error.code === 'email_exists') throw new ValidationError('An account already exists for this email. Please log in.');
    throw new ValidationError('We could not create your account. Please try again.');
  }

  // Setup finished: the token is used up and the email now logs in with its password.
  await admin.from('verification_codes').update({ setup_token_hash: null }).eq('email', email);
  await admin.from('authorized_emails').update({ account_created_at: new Date().toISOString() }).eq('email', email);
}
