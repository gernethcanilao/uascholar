import Link from 'next/link';
import { requireStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import PageHeader from '@/components/PageHeader/PageHeader';
import StatCard from '@/components/StatCard/StatCard';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import EmptyState from '@/components/EmptyState/EmptyState';
import LinkButton from '@/components/LinkButton/LinkButton';
import styles from './page.module.css';

export const metadata = { title: 'Student Dashboard | UA Scholar' };

export default async function StudentDashboardPage() {
  const { profile } = await requireStudent();
  const supabase = await createClient();

  const [{ data: applications }, { count: unreadCount }] = await Promise.all([
    supabase
      .from('applications')
      .select('id, status, submitted_at, scholarship:scholarships(name)')
      .eq('student_id', profile.id)
      .order('submitted_at', { ascending: false }),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false),
  ]);

  const list = applications ?? [];
  const countBy = (status) => list.filter((item) => item.status === status).length;

  return (
    <>
      <PageHeader title={`Hello, ${profile.full_name || 'Student'}!`} description="Here is an overview of your scholarship applications.">
        <LinkButton href="/scholarships">Apply for a scholarship</LinkButton>
      </PageHeader>

      <div className={styles.stats}>
        <StatCard label="Total applications" value={list.length} />
        <StatCard label="Pending" value={countBy('pending')} tone="pending" />
        <StatCard label="Approved" value={countBy('approved')} tone="approved" />
        <StatCard label="Rejected" value={countBy('rejected')} tone="rejected" />
      </div>

      {unreadCount > 0 && (
        <p className={styles.notice}>
          You have <strong>{unreadCount}</strong> unread notification{unreadCount === 1 ? '' : 's'}.{' '}
          <Link href="/student/notifications">View notifications</Link>
        </p>
      )}

      <section className={styles.panel}>
        <h2>Recent applications</h2>
        {list.length ? (
          <table>
            <thead>
              <tr><th>Scholarship</th><th>Submitted</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {list.slice(0, 5).map((application) => (
                <tr key={application.id}>
                  <td>{application.scholarship?.name ?? 'Scholarship'}</td>
                  <td>{formatDate(application.submitted_at)}</td>
                  <td><StatusBadge status={application.status} /></td>
                  <td><Link href={`/student/applications/${application.id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No applications yet" message="Browse the available scholarships and submit your first application." />
        )}
      </section>
    </>
  );
}
