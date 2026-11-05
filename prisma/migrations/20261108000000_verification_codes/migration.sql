-- CreateTable
CREATE TABLE "verification_codes" (
    "email" TEXT NOT NULL,
    "code_hash" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_sent_at" TIMESTAMPTZ(6),
    "send_window_start" TIMESTAMPTZ(6),
    "send_count" INTEGER NOT NULL DEFAULT 0,
    "setup_token_hash" TEXT,
    "verified_at" TIMESTAMPTZ(6),

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("email")
);

-- AddForeignKey
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_email_fkey" FOREIGN KEY ("email") REFERENCES "authorized_emails"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================================
-- UA Scholar - email verification codes (hand-written part)
-- Codes are generated, emailed (Resend) and checked by the Next.js server
-- (lib/verification.js) using the server-only Supabase service key.
-- Only HMAC hashes of codes and setup tokens are stored.
-- =====================================================================

-- Private: never reachable with the public (anon) key or a logged-in user's session.
revoke all on public.verification_codes from anon, authenticated;
alter table public.verification_codes enable row level security;
-- (No policies on purpose.)

-- The server uses the service key for this table and to mark setup as finished.
grant select, insert, update, delete on public.verification_codes to service_role;
grant select, update on public.authorized_emails to service_role;
