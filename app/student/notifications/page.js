import { requireStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { announcementSource, ANNOUNCEMENT_COLUMNS } from '@/lib/announcements';
import { markAllNotificationsRead } from './actions';
import PageHeader from '@/components/PageHeader/PageHeader';
import NotificationList from '@/components/NotificationList/NotificationList';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import styles from './page.module.css';

export const metadata = { title: 'Notifications | UA Scholar' };

export default async function NotificationsPage() {
  const { profile } = await requireStudent();
  const supabase = await createClient();

  const [{ data: notifications }, { data: announcements }] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, title, message, link, is_read, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('announcements')
      .select(ANNOUNCEMENT_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const hasUnread = notifications?.some((item) => !item.is_read);

  return (
    <>
      <PageHeader title="Notifications" description="Updates on your applications and announcements from the Scholarship Office.">
        {hasUnread && (
          <form action={markAllNotificationsRead}>
            <SubmitButton variant="outline" pendingText="Updating...">Mark all as read</SubmitButton>
          </form>
        )}
      </PageHeader>

      <div className={styles.columns}>
        <section>
          <h2 className={styles.heading}>Application updates</h2>
          <NotificationList
            items={(notifications ?? []).map((n) => ({ ...n, body: n.message }))}
            emptyText="No notifications yet."
          />
        </section>

        <section>
          <h2 className={styles.heading}>Announcements</h2>
          <NotificationList
            items={(announcements ?? []).map((a) => ({ ...a, source: announcementSource(a), is_read: true }))}
            emptyText="No announcements yet."
          />
        </section>
      </div>
    </>
  );
}
