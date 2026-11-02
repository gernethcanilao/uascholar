import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import { ROLES } from '@/lib/constants';
import PageHeader from '@/components/PageHeader/PageHeader';
import StatCard from '@/components/StatCard/StatCard';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import EmptyState from '@/components/EmptyState/EmptyState';
import styles from './page.module.css';

export const metadata = { title: 'Admin Dashboard | UA Scholar' };

export default async function AdminDashboardPage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  // RLS automatically limits scholarship admins to their assigned scholarships.
  const { data: applications } = await supabase
    .from('applications')
    .select('id, status, submitted_at, scholarship:scholarships(id, name), student:profiles!applications_student_id_fkey(full_name)')
    .order('submitted_at', { ascending: false });

  const list = applications ?? [];
  const countBy = (status) => list.filter((item) => item.status === status).length;

  const perScholarship = Object.values(
    list.reduce((groups, item) => {
      const key = item.scholarship?.id ?? 'unknown';
      groups[key] ??= { name: item.scholarship?.name ?? 'Unknown', pending: 0, approved: 0, rejected: 0, total: 0 };
      groups[key][item.status] += 1;
      groups[key].total += 1;
      return groups;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const isSuperAdmin = profile.role === ROLES.SUPER_ADMIN;

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description={isSuperAdmin ? 'Summary of all scholarship applications.' : 'Summary of applications for your assigned scholarships.'}
      />

      <div className={styles.stats}>
        <StatCard label="Total applications" value={list.length} />
        <StatCard label="Pending review" value={countBy('pending')} tone="pending" />
        <StatCard label="Approved" value={countBy('approved')} tone="approved" />
        <StatCard label="Rejected" value={countBy('rejected')} tone="rejected" />
      </div>

      <div className={styles.columns}>
        <section className={styles.panel}>
          <h2>By scholarship</h2>
          {perScholarship.length ? (
            <table>
              <thead>
                <tr><th>Scholarship</th><th>Pending</th><th>Approved</th><th>Rejected</th></tr>
              </thead>
              <tbody>
                {perScholarship.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.pending}</td>
                    <td>{row.approved}</td>
                    <td>{row.rejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No applications yet" />
          )}
        </section>

        <section className={styles.panel}>
          <h2>Latest submissions</h2>
          {list.length ? (
            <ul className={styles.recent}>
              {list.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <div>
                    <Link href={`/admin/applications/${item.id}`}>{item.student?.full_name || 'Student'}</Link>
                    <span>{item.scholarship?.name} · {formatDate(item.submitted_at)}</span>
                  </div>
                  <StatusBadge status={item.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing to review" />
          )}
        </section>
      </div>
    </>
  );
}
