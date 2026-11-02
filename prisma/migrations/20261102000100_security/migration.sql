-- =====================================================================
-- UA Scholar - security layer (hand-written; Prisma cannot express this)
--   * helper functions + triggers
--   * CHECK constraints
--   * table / column privileges
--   * Row Level Security policies
--   * private Storage bucket for encrypted documents
--
-- Prisma does not manage functions, triggers, policies, grants or CHECK
-- constraints, so later `prisma migrate diff` runs leave them untouched.
-- =====================================================================

-- ---------- Link profiles to Supabase Auth (via triggers, not a FK) ----------
-- A FK to auth.users would be unknown to Prisma and dropped by later diffs,
-- so creation and deletion are handled with triggers instead.

-- New auth user => student profile. The role is NEVER taken from user metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 150)
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Deleted auth user => profile removed (cascades to applications, documents, ...).
create or replace function public.handle_deleted_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end $$;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.handle_deleted_user();

-- ---------- CHECK constraints ----------
alter table public.documents
  add constraint documents_mime_type_check
    check (mime_type in ('application/pdf', 'image/png', 'image/jpeg')),
  add constraint documents_size_bytes_check
    check (size_bytes > 0);

-- ---------- Helper functions (SECURITY DEFINER avoids RLS recursion) ----------
create or replace function public.app_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() in ('admin', 'super_admin'), false)
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() = 'super_admin', false)
$$;

-- Super admins manage everything; admins only their assigned scholarships.
create or replace function public.can_manage_scholarship(target_scholarship uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_super_admin()
      or (public.app_role() = 'admin' and exists (
            select 1 from public.admin_assignments
            where admin_id = auth.uid() and scholarship_id = target_scholarship))
$$;

create or replace function public.can_view_application(target_application uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.applications a
    where a.id = target_application
      and (a.student_id = auth.uid() or public.can_manage_scholarship(a.scholarship_id)))
$$;

create or replace function public.admin_can_view_student(target_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_super_admin() or exists (
    select 1 from public.applications a
    where a.student_id = target_student and public.can_manage_scholarship(a.scholarship_id))
$$;

create or replace function public.has_applied(target_scholarship uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.applications
    where scholarship_id = target_scholarship and student_id = auth.uid())
$$;

-- ---------- Triggers ----------
-- Only super admins may change role / active status / email.
-- (auth.uid() is null only for trusted SQL Editor / migration sessions.)
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role
      or new.is_active is distinct from old.is_active
      or new.email is distinct from old.email)
     and auth.uid() is not null
     and not public.is_super_admin() then
    raise exception 'Not allowed to change role, status or email';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists touch_scholarships on public.scholarships;
create trigger touch_scholarships
  before update on public.scholarships
  for each row execute function public.touch_updated_at();

-- ---------- Privileges ----------
-- Grant explicitly instead of relying on Supabase default privileges, so it
-- also works when migrations run as a dedicated database user.
grant usage on schema public to anon, authenticated;
revoke all on all tables in schema public from anon, authenticated;

-- Prisma's migration history table must never be reachable via the API.
alter table public._prisma_migrations enable row level security;

grant select on public.scholarships to anon;

grant select on
  public.profiles, public.scholarships, public.admin_assignments, public.applications,
  public.documents, public.notifications, public.announcements
  to authenticated;

grant insert on
  public.scholarships, public.admin_assignments, public.applications,
  public.documents, public.notifications, public.announcements
  to authenticated;

grant delete on public.scholarships, public.admin_assignments, public.announcements to authenticated;

grant update on public.scholarships to authenticated;
-- Column-level: users can never write ids, emails or timestamps directly.
grant update (full_name, role, is_active, personal_data_encrypted, academic_data_encrypted, admin_data_encrypted)
  on public.profiles to authenticated;
-- Admins can only change review fields, never the student's answers.
grant update (status, review_notes_encrypted, reviewed_by, reviewed_at) on public.applications to authenticated;
grant update (is_read) on public.notifications to authenticated;

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.scholarships enable row level security;
alter table public.admin_assignments enable row level security;
alter table public.applications enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.announcements enable row level security;

-- profiles
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_super_admin() or public.admin_can_view_student(id));

create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_update_super_admin" on public.profiles for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- scholarships (public can read active listings)
create policy "scholarships_select" on public.scholarships for select to anon, authenticated
  using (is_active or public.is_admin() or public.has_applied(id));

create policy "scholarships_insert" on public.scholarships for insert to authenticated
  with check (public.is_super_admin());

create policy "scholarships_update" on public.scholarships for update to authenticated
  using (public.can_manage_scholarship(id)) with check (public.can_manage_scholarship(id));

create policy "scholarships_delete" on public.scholarships for delete to authenticated
  using (public.is_super_admin());

-- admin_assignments
create policy "assignments_select" on public.admin_assignments for select to authenticated
  using (admin_id = auth.uid() or public.is_super_admin());

create policy "assignments_insert" on public.admin_assignments for insert to authenticated
  with check (public.is_super_admin());

create policy "assignments_delete" on public.admin_assignments for delete to authenticated
  using (public.is_super_admin());

-- applications
create policy "applications_select" on public.applications for select to authenticated
  using (student_id = auth.uid() or public.can_manage_scholarship(scholarship_id));

create policy "applications_insert" on public.applications for insert to authenticated
  with check (
    student_id = auth.uid()
    and public.app_role() = 'student'
    and status = 'pending'
    and reviewed_by is null
    and exists (select 1 from public.scholarships s where s.id = scholarship_id and s.is_active)
  );

create policy "applications_update" on public.applications for update to authenticated
  using (public.can_manage_scholarship(scholarship_id))
  with check (public.can_manage_scholarship(scholarship_id));

-- documents
create policy "documents_select" on public.documents for select to authenticated
  using (public.can_view_application(application_id));

create policy "documents_insert" on public.documents for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (select 1 from public.applications a
                where a.id = application_id and a.student_id = auth.uid() and a.status = 'pending')
  );

-- notifications
create policy "notifications_select" on public.notifications for select to authenticated
  using (user_id = auth.uid());

create policy "notifications_insert" on public.notifications for insert to authenticated
  with check (user_id = auth.uid() or public.admin_can_view_student(user_id));

create policy "notifications_update" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- announcements
create policy "announcements_select" on public.announcements for select to authenticated
  using (true);

create policy "announcements_insert" on public.announcements for insert to authenticated
  with check (public.is_admin() and created_by = auth.uid());

create policy "announcements_delete" on public.announcements for delete to authenticated
  using (created_by = auth.uid() or public.is_super_admin());

-- ---------- Storage: private bucket for encrypted documents ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 10485760)
on conflict (id) do nothing;

drop policy if exists "documents_upload_own_folder" on storage.objects;
create policy "documents_upload_own_folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documents_read_allowed" on storage.objects;
create policy "documents_read_allowed" on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.documents d
                 where d.storage_path = storage.objects.name
                   and public.can_view_application(d.application_id))
    )
  );

drop policy if exists "documents_delete_own_folder" on storage.objects;
create policy "documents_delete_own_folder" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
