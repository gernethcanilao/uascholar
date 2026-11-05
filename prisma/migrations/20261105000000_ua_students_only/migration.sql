-- =====================================================================
-- UA Scholar - UA students only (hand-written)
--   * New accounts must use a UA email (@ua.edu.ph). Public registration
--     was removed from the app; this blocks it at the database as well,
--     including sign-ups made directly against the Supabase API.
--   * Scholarship listings are no longer public: logged-out visitors
--     (the "anon" role) can no longer read the scholarships table.
-- Existing accounts are not changed.
-- =====================================================================

-- ---------- New auth user => student profile, UA email only ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is null or lower(new.email) not like '%@ua.edu.ph' then
    raise exception 'Only University of the Assumption email accounts (@ua.edu.ph) can sign up';
  end if;

  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 150)
  );
  return new;
end $$;

-- ---------- Scholarships: logged-in users only ----------
revoke select on public.scholarships from anon;

drop policy if exists "scholarships_select" on public.scholarships;
create policy "scholarships_select" on public.scholarships for select to authenticated
  using (is_active or public.is_admin() or public.has_applied(id));
