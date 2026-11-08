-- =====================================================================
-- Announcements belong to a scholarship -> source "Academic Scholarship Admin"
--
-- Replaces the category-based label from *_announcement_source:
--   super admin                          -> 'General Admin'
--   admin, for one assigned scholarship  -> '<scholarship name> Admin'
--     (an admin with one assignment gets it automatically; an admin with
--      several must choose one, and only from their own assignments)
--
-- The trigger computes everything from the author's real role and
-- assignments; a client cannot pick someone else's scholarship or label,
-- and nothing can be changed after publishing.
-- =====================================================================

-- AlterTable / AddForeignKey (also in prisma/schema.prisma as Announcement.scholarshipId)
ALTER TABLE "announcements" ADD COLUMN "scholarship_id" UUID;
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "scholarships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

create or replace function public.set_announcement_source()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  author_role public.user_role;
  assignment_count int;
begin
  if tg_op = 'UPDATE' then
    -- Source, author and scholarship are fixed once published.
    new.source_label := old.source_label;
    new.created_by := old.created_by;
    new.scholarship_id := old.scholarship_id;
    return new;
  end if;

  select role into author_role from public.profiles where id = new.created_by;

  if author_role = 'super_admin' then
    new.scholarship_id := null;
    new.source_label := 'General Admin';
  elsif author_role = 'admin' then
    if new.scholarship_id is null then
      select count(*) into assignment_count from public.admin_assignments where admin_id = new.created_by;
      if assignment_count = 1 then
        select scholarship_id into new.scholarship_id from public.admin_assignments where admin_id = new.created_by;
      else
        raise exception 'Choose which of your assigned scholarships this announcement is for.';
      end if;
    elsif not exists (
      select 1 from public.admin_assignments
       where admin_id = new.created_by and scholarship_id = new.scholarship_id
    ) then
      raise exception 'You can only post announcements for scholarships assigned to you.';
    end if;
    select s.name || ' Admin' into new.source_label from public.scholarships s where s.id = new.scholarship_id;
  else
    new.scholarship_id := null;
    new.source_label := null;
  end if;

  return new;
end $$;

-- The category-based helper from the previous migration is no longer used.
drop function if exists public.announcement_source_for(uuid);

-- Re-label existing announcements (the trigger is paused because it keeps labels fixed on UPDATE).
-- Titles and messages are not touched.
alter table public.announcements disable trigger announcements_set_source;

update public.announcements a
   set source_label = case p.role
         when 'super_admin' then 'General Admin'
         -- Several assignments: the scholarship cannot be verified, so no specific one is guessed.
         when 'admin' then case
           when (select count(*) from public.admin_assignments x where x.admin_id = p.id) = 1
             then (select s.name || ' Admin' from public.admin_assignments x
                     join public.scholarships s on s.id = x.scholarship_id where x.admin_id = p.id)
           else 'Scholarship Admin'
         end
       end,
       scholarship_id = case
         when p.role = 'admin' and (select count(*) from public.admin_assignments x where x.admin_id = p.id) = 1
           then (select x.scholarship_id from public.admin_assignments x where x.admin_id = p.id)
       end
  from public.profiles p
 where p.id = a.created_by;

alter table public.announcements enable trigger announcements_set_source;
