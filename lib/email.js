import 'server-only';
import { ConfigError } from './supabase/admin';

const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * Sends an email through Resend (https://resend.com) using its HTTP API.
 * Requires RESEND_API_KEY and EMAIL_FROM (a sender on a domain verified in Resend).
 * Throws ConfigError when not configured, or Error when Resend rejects the email.
 */
export async function sendEmail({ to, subject, text, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey) throw new ConfigError('RESEND_API_KEY is not set.');
  if (!from) throw new ConfigError('EMAIL_FROM is not set.');

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Resend rejected the email (${response.status}): ${details.slice(0, 300)}`);
  }
}
