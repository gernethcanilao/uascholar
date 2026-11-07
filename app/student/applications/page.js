import Link from 'next/link';
import { requireStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/format';
import PageHeader from '@/components/PageHeader/PageHeader';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import EmptyState from '@/components/EmptyState/EmptyState';
import styles from './page.module.css';

export const metadata = { title: 'My Applications | UA Scholar' };

export default async function MyApplicationsPage() {
  const { profile } = await requireStudent();
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from('applications')
    .select('id, status, submitted_at, reviewed_at, scholarship:scholarships(name, category)')
    .eq('student_id', profile.id)
    .order('submitted_at', { ascending: false });

  return (
    <>
      <PageHeader title="My Applications" description="All the scholarship applications you have submitted." />

      {applications?.length ? (
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Scholarship</th>
                <th>Category</th>
                <th>Submitted</th>
                <th>Last update</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td className={styles.name}>{application.scholarship?.name ?? 'Scholarship'}</td>
                  <td>{application.scholarship?.category ?? '—'}</td>
                  <td>{formatDate(application.submitted_at)}</td>
                  <td>{formatDate(application.reviewed_at ?? application.submitted_at)}</td>
                  <td><StatusBadge status={application.status} /></td>
                  <td><Link href={`/student/applications/${application.id}`}>Track</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="You have not applied yet" message="Find a scholarship that matches you." />
      )}
    </>
  );
}
