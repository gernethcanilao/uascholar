-- =====================================================================
-- Announcement source ("Academic Scholarship Admin", "General Admin", ...)
--
-- Students cannot read admin profiles (RLS), so the label is stored on the
-- announcement itself. It is ALWAYS computed in the database from the
-- author's role and assigned scholarship categories; any value sent by a
-- client is overwritten, so an admin cannot pose as another office.
--
-- Additive only: existing announcements and their content are not changed,
-- apart from filling in the new column where the author is still known.
-- =====================================================================

-- AlterTable (also in prisma/schema.prisma as Announcement.sourceLabel)
ALTER TABLE "announcements" ADD COLUMN "source_label" TEXT;

-- Label for an author:
--   super admin                        -> 'General Admin'
--   admin assigned to one category     -> 'Academic Scholarship Admin'
--   admin assigned to several          -> 'Academic & Grant Scholarship Admin'
--   admin without assignments          -> 'Scholarship Admin'
--   unknown / no longer an admin       -> NULL (the app shows 'Administration')
create or replace function public.announcement_source_for(author_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select case p.role
    when 'super_admin' then 'General Admin'
    when 'admin' then coalesce(
      (select string_agg(distinct s.category::text, ' & ' order by s.category::text) || ' Scholarship Admin'
         from public.admin_assignments a
         join public.scholarships s on s.id = a.scholarship_id
        where a.admin_id = p.id),
      'Scholarship Admin')
  end
  from public.profiles p
  where p.id = author_id
$$;

-- Only used by the trigger below; not callable through the API.
revoke execute on function public.announcement_source_for(uuid) from public, anon, authenticated;

-- Existing announcements: fill in the source only where the author still exists and is an admin.
-- Announcements whose author was deleted (created_by is NULL) stay NULL -> shown as 'Administration'.
update public.announcements
   set source_label = public.announcement_source_for(created_by)
 where source_label is null
   and created_by is not null;

-- New announcements get their source from the database; it can never be changed afterwards.
create or replace function public.set_announcement_source()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.source_label := public.announcement_source_for(new.created_by);
  else
    new.source_label := old.source_label;
    new.created_by := old.created_by;
  end if;
  return new;
end $$;

drop trigger if exists announcements_set_source on public.announcements;
create trigger announcements_set_source
  before insert or update on public.announcements
  for each row execute function public.set_announcement_source();
