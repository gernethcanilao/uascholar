-- AlterTable
ALTER TABLE "authorized_emails" ADD COLUMN "account_created_at" TIMESTAMPTZ(6);

-- =====================================================================
-- UA Scholar - track when first-time setup is really finished (hand-written)
--
-- Supabase gives every account created from an emailed code a random,
-- unknown temporary password. So "confirmed email + has a password" does
-- NOT mean the student has created their own password yet.
--
-- authorized_emails.account_created_at is set only when the password of a
-- confirmed account is CHANGED (the student's "Create password" step).
-- It is written by a trigger on auth.users, so it cannot be set through the API.
-- =====================================================================

create or replace function public.handle_password_set()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null
     and new.encrypted_password is distinct from old.encrypted_password then
    update public.authorized_emails
    set account_created_at = coalesce(account_created_at, now())
    where email = lower(new.email);
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_password_set on auth.users;
create trigger on_auth_user_password_set
  after update of encrypted_password on auth.users
  for each row execute function public.handle_password_set();

-- ---------- Login step 1: what should this email do next? ----------
-- Authorized students: password login only after they finished setup;
--   until then (including a verified email with only the temporary password) => send a code.
-- Other accounts (e.g. existing admins): confirmed email + password => password login.
create or replace function public.account_setup_status(target_email text)
returns text language sql stable security definer set search_path = public as $$
  select case
    when a.email is not null then
      case
        when a.account_created_at is not null and exists (
          select 1 from auth.users u
          where lower(u.email) = a.email and u.email_confirmed_at is not null)
          then 'existing'
        else 'authorized'
      end
    when exists (
      select 1 from auth.users u
      where lower(u.email) = lower(target_email)
        and u.email_confirmed_at is not null
        and coalesce(u.encrypted_password, '') <> '')
      then 'existing'
    else 'not_authorized'
  end
  from (select 1) as one
  left join public.authorized_emails a on a.email = lower(target_email)
$$;

revoke all on function public.account_setup_status(text) from public;
grant execute on function public.account_setup_status(text) to anon, authenticated;
