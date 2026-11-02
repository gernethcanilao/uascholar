import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/format';
import { ROLES } from '@/lib/constants';
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

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body, created_at, created_by')
    .order('created_at', { ascending: false });

  const canDelete = (item) => profile.role === ROLES.SUPER_ADMIN || item.created_by === profile.id;

  return (
    <>
      <PageHeader title="Announcements" description="Share important updates with all students." />

      <div className={styles.columns}>
        <section className={styles.card}>
          <h2>New announcement</h2>
          <AnnouncementForm />
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
