import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate, capitalize } from '@/lib/format';
import { isUuid } from '@/lib/validation';
import { APPLICATION_STATUSES } from '@/lib/constants';
import PageHeader from '@/components/PageHeader/PageHeader';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import EmptyState from '@/components/EmptyState/EmptyState';
import styles from './page.module.css';

export const metadata = { title: 'Applications | UA Scholar Admin' };

export default async function AdminApplicationsPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const status = APPLICATION_STATUSES.includes(params.status) ? params.status : '';
  const scholarshipId = isUuid(params.scholarship) ? params.scholarship : '';

  const supabase = await createClient();

  let request = supabase
    .from('applications')
    .select('id, status, submitted_at, scholarship:scholarships(name), student:profiles!applications_student_id_fkey(full_name, email)')
    .order('submitted_at', { ascending: false });

  if (status) request = request.eq('status', status);
  if (scholarshipId) request = request.eq('scholarship_id', scholarshipId);

  const [{ data: applications }, { data: scholarships }] = await Promise.all([
    request,
    supabase.from('scholarships').select('id, name').order('name'),
  ]);

  return (
    <>
      <PageHeader title="Applications" description="Review submitted scholarship applications." />

      <form method="get" className={styles.filters}>
        <select name="status" defaultValue={status} aria-label="Filter by status">
          <option value="">All statuses</option>
          {APPLICATION_STATUSES.map((item) => <option key={item} value={item}>{capitalize(item)}</option>)}
        </select>
        <select name="scholarship" defaultValue={scholarshipId} aria-label="Filter by scholarship">
          <option value="">All scholarships</option>
          {scholarships?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <button type="submit" className={styles.button}>Filter</button>
      </form>

      {applications?.length ? (
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr><th>Student</th><th>Scholarship</th><th>Submitted</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <strong>{application.student?.full_name || '—'}</strong>
                    <span className={styles.email}>{application.student?.email}</span>
                  </td>
                  <td>{application.scholarship?.name}</td>
                  <td>{formatDate(application.submitted_at)}</td>
                  <td><StatusBadge status={application.status} /></td>
                  <td><Link href={`/admin/applications/${application.id}`}>Review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No applications found" message="Try changing the filters." />
      )}
    </>
  );
}
