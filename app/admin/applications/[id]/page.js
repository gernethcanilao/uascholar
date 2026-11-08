import { notFound } from 'next/navigation';
import { requireAdmin, canAccessScholarship } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { decryptStudentData, decryptAdminData } from '@/app/_lib/aes-encryption';
import { decryptStudentProfile } from '@/lib/profile';
import { isUuid } from '@/lib/validation';
import { formatDate, formatDateTime, formatPeso } from '@/lib/format';
import PageHeader from '@/components/PageHeader/PageHeader';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import DocumentList from '@/components/DocumentList/DocumentList';
import ReviewForm from '@/components/ReviewForm/ReviewForm';
import styles from './page.module.css';

export const metadata = { title: 'Review Application | UA Scholar Admin' };

export default async function AdminApplicationReviewPage({ params }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const { data: application } = await supabase
    .from('applications')
    .select(`
      id, scholarship_id, status, submitted_at, reviewed_at, form_data_encrypted, review_notes_encrypted,
      scholarship:scholarships(name),
      student:profiles!applications_student_id_fkey(id, full_name, email, personal_data_encrypted, academic_data_encrypted),
      reviewer:profiles!applications_reviewed_by_fkey(full_name)
    `)
    .eq('id', id)
    .maybeSingle();

  if (!application) notFound();
  // Only decrypt confidential records for admins assigned to this scholarship.
  if (!(await canAccessScholarship(profile, application.scholarship_id))) notFound();

  const studentId = application.student?.id;
  const { personal, academic } = decryptStudentProfile(application.student);
  const answers = decryptStudentData(application.form_data_encrypted, studentId, {});
  const reviewNotes = decryptAdminData(application.review_notes_encrypted, application.id, '');

  const { data: documentRows } = await supabase
    .from('documents')
    .select('id, document_type, file_name_encrypted, size_bytes, uploaded_at')
    .eq('application_id', application.id)
    .order('uploaded_at');

  const documents = (documentRows ?? []).map((doc) => ({
    ...doc,
    fileName: decryptStudentData(doc.file_name_encrypted, studentId, 'document'),
  }));

  return (
    <>
      <PageHeader title={application.student?.full_name || 'Student'} description={`${application.scholarship?.name} · submitted ${formatDate(application.submitted_at)}`}>
        <StatusBadge status={application.status} />
      </PageHeader>

      <div className={styles.columns}>
        <div>
          <section className={styles.card}>
            <h2>Student information</h2>
            <dl className={styles.details}>
              <dt>Email</dt><dd>{application.student?.email}</dd>
              <dt>Student number</dt><dd>{personal.studentNumber || '—'}</dd>
              <dt>Contact number</dt><dd>{personal.phone || '—'}</dd>
              <dt>Address</dt><dd>{personal.address || '—'}</dd>
              <dt>College</dt><dd>{academic.college || '—'}</dd>
              <dt>Program</dt><dd>{academic.course || '—'}</dd>
              <dt>Year level</dt><dd>{academic.yearLevel || '—'}</dd>
              {academic.gwa !== '' && academic.gwa != null && <><dt>GWA</dt><dd>{academic.gwa}</dd></>}
            </dl>
          </section>

          <section className={styles.card}>
            <h2>Application answers</h2>
            <dl className={styles.details}>
              <dt>Reason</dt><dd>{answers.reason || '—'}</dd>
              <dt>Monthly family income</dt><dd>{formatPeso(answers.monthlyFamilyIncome)}</dd>
              <dt>Siblings</dt><dd>{answers.numberOfSiblings ?? '—'}</dd>
              <dt>Achievements</dt><dd>{answers.achievements || '—'}</dd>
            </dl>
          </section>

          <section className={styles.card}>
            <h2>Documents</h2>
            <DocumentList documents={documents} />
          </section>
        </div>

        <aside className={`${styles.card} ${styles.review}`}>
          <h2>Review decision</h2>
          {application.reviewed_at && (
            <p className={styles.reviewed}>
              Last reviewed {formatDateTime(application.reviewed_at)}
              {application.reviewer?.full_name && <> by {application.reviewer.full_name}</>}
            </p>
          )}
          <ReviewForm applicationId={application.id} currentNotes={reviewNotes} />
        </aside>
      </div>
    </>
  );
}
