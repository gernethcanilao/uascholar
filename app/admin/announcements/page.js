import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/format';
import { ROLES } from '@/lib/constants';
import { announcementSource, ANNOUNCEMENT_COLUMNS } from '@/lib/announcements';
import { deleteAnnouncement } from './actions';
import PageHeader from '@/components/PageHeader/PageHeader';
import AnnouncementForm from '@/components/AnnouncementForm/AnnouncementForm';
import ConfirmButton from '@/components/ConfirmButton/ConfirmButton';
import EmptyState from '@/components/EmptyState/EmptyState';
import styles from './page.module.css';

export const metadata = { title: 'Announcements | UA Scholar Admin' };

export default async function AnnouncementsPage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const [{ data: announcements }, { data: assignments }] = await Promise.all([
    supabase.from('announcements').select(ANNOUNCEMENT_COLUMNS).order('created_at', { ascending: false }),
    // Scholarships this admin may post for (the source label is "<scholarship name> Admin").
    supabase
      .from('admin_assignments')
      .select('scholarship:scholarships(id, name)')
      .eq('admin_id', profile.id),
  ]);
  const isSuperAdmin = profile.role === ROLES.SUPER_ADMIN;
  const myScholarships = isSuperAdmin
    ? []
    : (assignments ?? [])
        .map((row) => row.scholarship)
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));

  const canDelete = (item) => profile.role === ROLES.SUPER_ADMIN || item.created_by === profile.id;

  return (
    <>
      <PageHeader title="Announcements" description="Share important updates with all students." />

      <div className={styles.columns}>
        <section className={styles.card}>
          <h2>New announcement</h2>
          <AnnouncementForm isSuperAdmin={isSuperAdmin} scholarships={myScholarships} />
        </section>

        <section>
          <h2 className={styles.heading}>Published</h2>
          {announcements?.length ? (
            <ul className={styles.list}>
              {announcements.map((item) => (
                <li key={item.id} className={styles.item}>
                  <div className={styles.itemTop}>
                    <strong>{item.title}</strong>
                    <time>{formatDateTime(item.created_at)}</time>
                  </div>
                  <span className={styles.source}>{announcementSource(item)}</span>
                  <p>{item.body}</p>
                  {canDelete(item) && (
                    <form action={deleteAnnouncement}>
                      <input type="hidden" name="id" value={item.id} />
                      <ConfirmButton message="Delete this announcement?">Delete</ConfirmButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No announcements yet" />
          )}
        </section>
      </div>
    </>
  );
}
