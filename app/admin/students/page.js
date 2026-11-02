import { requireAdmin, getAccessibleScholarshipIds } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { decryptStudentProfile } from '@/lib/profile';
import { sanitizeSearch } from '@/lib/validation';
import { formatDate } from '@/lib/format';
import { ROLES } from '@/lib/constants';
import PageHeader from '@/components/PageHeader/PageHeader';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import EmptyState from '@/components/EmptyState/EmptyState';
import styles from './page.module.css';

export const metadata = { title: 'Student Directory | UA Scholar Admin' };

export default async function StudentDirectoryPage({ searchParams }) {
  const { profile } = await requireAdmin();
  const params = await searchParams;
  const query = sanitizeSearch(params.q);

  const supabase = await createClient();
  // RLS: super admins see every student; scholarship admins only see
  // students who applied to the scholarships assigned to them.
  let request = supabase
    .from('profiles')
    .select('id, full_name, email, is_active, created_at, personal_data_encrypted, academic_data_encrypted')
    .eq('role', ROLES.STUDENT)
    .order('full_name');

  if (query) request = request.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);

  const { data: rows } = await request;

  // Second check before decrypting: limit scholarship admins to applicants
  // of their assigned scholarships (null = super admin, sees everyone).
  const scholarshipIds = await getAccessibleScholarshipIds(profile);
  let allowedStudentIds = null;
  if (scholarshipIds) {
    const { data: applicants } = scholarshipIds.length
      ? await supabase.from('applications').select('student_id').in('scholarship_id', scholarshipIds)
      : { data: [] };
    allowedStudentIds = new Set((applicants ?? []).map((item) => item.student_id));
  }

  const students = (rows ?? [])
    .filter((row) => !allowedStudentIds || allowedStudentIds.has(row.id))
    .map((row) => ({ ...row, ...decryptStudentProfile(row) }));

  return (
    <>
      <PageHeader
        title="Student Directory"
        description={profile.role === ROLES.SUPER_ADMIN
          ? 'All registered student accounts.'
          : 'Students who applied to your assigned scholarships.'}
      />

      <form method="get" className={styles.search} role="search">
        <input type="search" name="q" defaultValue={query} placeholder="Search by name or email..." maxLength={60} aria-label="Search students" />
        <button type="submit" className={styles.button}>Search</button>
      </form>

      {students.length ? (
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr><th>Name</th><th>Student no.</th><th>Course</th><th>Year</th><th>Registered</th><th>Status</th></tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>
                    <strong>{student.full_name || '—'}</strong>
                    <span className={styles.email}>{student.email}</span>
                  </td>
                  <td>{student.personal.studentNumber || '—'}</td>
                  <td>{student.academic.course || '—'}</td>
                  <td>{student.academic.yearLevel || '—'}</td>
                  <td>{formatDate(student.created_at)}</td>
                  <td><StatusBadge status={student.is_active ? 'active' : 'inactive'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No students found" />
      )}
    </>
  );
}
