import { notFound } from 'next/navigation';
import { requireStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { isUuid } from '@/lib/validation';
import PageHeader from '@/components/PageHeader/PageHeader';
import EligibilityChecklist from '@/components/EligibilityChecklist/EligibilityChecklist';
import LinkButton from '@/components/LinkButton/LinkButton';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import styles from './page.module.css';

export const metadata = { title: 'Eligibility Checklist | UA Scholar' };

export default async function EligibilityPage({ params }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { profile } = await requireStudent();
  const supabase = await createClient();

  const [{ data: scholarship }, { data: existing }] = await Promise.all([
    supabase
      .from('scholarships')
      .select('id, name, slug, eligibility, required_documents')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('applications')
      .select('id, status')
      .eq('scholarship_id', id)
      .eq('student_id', profile.id)
      .maybeSingle(),
  ]);

  if (!scholarship) notFound();

  return (
    <>
      <PageHeader title="Eligibility Checklist" description={scholarship.name} />

      {existing ? (
        <div className={styles.card}>
          <p>
            You already applied for this scholarship. Current status: <StatusBadge status={existing.status} />
          </p>
          <LinkButton href={`/student/applications/${existing.id}`}>View application</LinkButton>
        </div>
      ) : (
        <div className={styles.card}>
          <p className={styles.intro}>
            Review each requirement and tick the ones you meet. You can continue once all requirements are checked.
          </p>
          <EligibilityChecklist
            items={scholarship.eligibility}
            documents={scholarship.required_documents}
            applyHref={`/student/scholarships/${scholarship.id}/apply`}
          />
        </div>
      )}
    </>
  );
}
