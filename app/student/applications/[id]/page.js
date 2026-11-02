import { notFound } from 'next/navigation';
import { requireStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { decryptStudentData } from '@/app/_lib/aes-encryption';
import { isUuid } from '@/lib/validation';
import { formatDate, formatPeso } from '@/lib/format';
import PageHeader from '@/components/PageHeader/PageHeader';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import StatusTimeline from '@/components/StatusTimeline/StatusTimeline';
import DocumentList from '@/components/DocumentList/DocumentList';
import DocumentUpload from '@/components/DocumentUpload/DocumentUpload';
import styles from './page.module.css';

export const metadata = { title: 'Application Status | UA Scholar' };

export default async function ApplicationDetailsPage({ params }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { profile } = await requireStudent();
  const supabase = await createClient();

  const { data: application } = await supabase
    .from('applications')
    .select('id, status, submitted_at, reviewed_at, form_data_encrypted, scholarship:scholarships(name)')
    .eq('id', id)
    .eq('student_id', profile.id)
    .maybeSingle();

  if (!application) notFound();

  const { data: documentRows } = await supabase
    .from('documents')
    .select('id, document_type, file_name_encrypted, size_bytes, uploaded_at')
    .eq('application_id', application.id)
    .order('uploaded_at');

  const answers = decryptStudentData(application.form_data_encrypted, profile.id, {});
  const documents = (documentRows ?? []).map((doc) => ({
    ...doc,
    fileName: decryptStudentData(doc.file_name_encrypted, profile.id, 'document'),
  }));

  return (
    <>
      <PageHeader title={application.scholarship?.name ?? 'Application'} description={`Submitted ${formatDate(application.submitted_at)}`}>
        <StatusBadge status={application.status} />
      </PageHeader>

      <section className={styles.card}>
        <h2>Application status</h2>
        <StatusTimeline status={application.status} submittedAt={application.submitted_at} reviewedAt={application.reviewed_at} />
      </section>

      <section className={styles.card}>
        <h2>Your answers</h2>
        <dl className={styles.details}>
          <dt>Reason for applying</dt>
          <dd>{answers.reason || '—'}</dd>
          <dt>Monthly family income</dt>
          <dd>{formatPeso(answers.monthlyFamilyIncome)}</dd>
          <dt>Number of siblings</dt>
          <dd>{answers.numberOfSiblings ?? '—'}</dd>
          <dt>Achievements</dt>
          <dd>{answers.achievements || '—'}</dd>
        </dl>
      </section>

      <section className={styles.card}>
        <h2>Documents</h2>
        <DocumentList documents={documents} />
        {application.status === 'pending' && <DocumentUpload applicationId={application.id} />}
      </section>
    </>
  );
}
