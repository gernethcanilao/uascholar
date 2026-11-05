-- CreateTable
CREATE TABLE "authorized_emails" (
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authorized_emails_pkey" PRIMARY KEY ("email")
);

-- =====================================================================
-- UA Scholar - authorized student emails (hand-written part)
--   * Only emails in public.authorized_emails can create an account.
--     The student proves they own the email with a one-time code
--     (Supabase Auth) and then sets a password.
--   * The list is private: no API access, managed in the SQL Editor.
--
-- Add another student later (Dashboard > SQL Editor):
--   insert into public.authorized_emails (email) values ('name.student@ua.edu.ph');
-- Remove one:
--   delete from public.authorized_emails where email = 'name.student@ua.edu.ph';
-- =====================================================================

-- ---------- Valid, lowercase UA emails only (primary key prevents duplicates) ----------
alter table public.authorized_emails
  add constraint authorized_emails_email_check
    check (email = lower(email) and email ~ '^[a-z0-9._%+-]+@ua\.edu\.ph$');

-- ---------- Private: not reachable through the Supabase API ----------
revoke all on public.authorized_emails from anon, authenticated;
alter table public.authorized_emails enable row level security;
-- (No policies on purpose: only the SQL Editor / migrations can read or change it.)

-- ---------- Initial authorized students ----------
insert into public.authorized_emails (email) values
  ('madbuenaventura.student@ua.edu.ph'),
  ('glcanilao.student@ua.edu.ph'),
  ('kccabantog.student@ua.edu.ph')
on conflict (email) do nothing;

-- ---------- New auth user => student profile, authorized emails only ----------
-- Also blocks sign-ups made directly against the Supabase API.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is null
     or not exists (select 1 from public.authorized_emails where email = lower(new.email)) then
    raise exception 'This email is not authorized to set up an account';
  end if;

  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 150)
  );
  return new;
end $$;

-- ---------- Login step 1: what should this email do next? ----------
-- 'existing'       => account is set up (verified email + password): ask for the password
-- 'authorized'     => on the list, no finished account yet: send a verification code
-- 'not_authorized' => cannot set up an account
-- Returns only a status, never the list itself.
create or replace function public.account_setup_status(target_email text)
returns text language sql stable security definer set search_path = public as $$
  select case
    when exists (
      select 1 from auth.users u
      where lower(u.email) = lower(target_email)
        and u.email_confirmed_at is not null
        and coalesce(u.encrypted_password, '') <> '')
      then 'existing'
    when exists (select 1 from public.authorized_emails where email = lower(target_email))
      then 'authorized'
    else 'not_authorized'
  end
$$;

revoke all on function public.account_setup_status(text) from public;
grant execute on function public.account_setup_status(text) to anon, authenticated;
